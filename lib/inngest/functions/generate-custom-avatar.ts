import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { trainLora, generateFluxImage } from "@/lib/fal/client";
import { sendAvatarCompleteEmail } from "@/lib/email/send";
import { createTempDir, cleanup } from "@/lib/video/ffmpeg";
import { createZipFromUrls } from "@/lib/utils/zip";
import path from "path";

export const generateCustomAvatar = inngest.createFunction(
  {
    id: "generate-custom-avatar",
    name: "Generate Custom AI Avatar (LoRA Training)",
    retries: 2,
    onFailure: async ({ error, event }: any) => {
      const supabase = createAdminClient();

      // Refund credits on failure
      const { data: avatar } = await supabase
        .from("avatars")
        .select("user_id")
        .eq("id", event.data.avatarId)
        .single();

      if (avatar) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("credits")
          .eq("id", avatar.user_id)
          .single();

        if (profile) {
          await supabase
            .from("user_profiles")
            .update({ credits: profile.credits + 20 })
            .eq("id", avatar.user_id);

          await supabase.from("credit_transactions").insert({
            user_id: avatar.user_id,
            amount: 20,
            type: "refund",
            balance_after: profile.credits + 20,
            metadata: {
              reason: "custom_avatar_failed",
              avatar_id: event.data.avatarId,
              error: error.message,
            },
          });
        }
      }

      await supabase
        .from("avatars")
        .update({
          status: "failed",
          metadata: { error_message: error.message },
        })
        .eq("id", event.data.avatarId);
    },
  },
  { event: "avatar/generate-custom" },
  async ({ event, step }) => {
    const { avatarId, trainingImages } = event.data;

    // Step 1: Update status to processing
    await step.run("start-training", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("avatars")
        .update({
          status: "processing",
          metadata: {
            stage: "preparing",
            progress: 0,
          },
        })
        .eq("id", avatarId);
    });

    // Step 2: Prepare training data (create ZIP)
    const zipData = await step.run("prepare-zip", async () => {
      const supabase = createAdminClient();
      const tempDir = await createTempDir("avatar-training-");
      const zipPath = path.join(tempDir, "training.zip");

      await supabase
        .from("avatars")
        .update({
          metadata: {
            stage: "preparing",
            progress: 10,
          },
        })
        .eq("id", avatarId);

      // Create ZIP from uploaded images
      await createZipFromUrls(trainingImages, zipPath, tempDir);

      // Upload ZIP to storage for FAL AI
      const fs = await import("fs/promises");
      const zipBuffer = await fs.readFile(zipPath);
      const { data: uploadData, error } = await supabase.storage
        .from("avatar-training")
        .upload(`${avatarId}/training.zip`, zipBuffer, {
          contentType: "application/zip",
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("avatar-training")
        .getPublicUrl(uploadData.path);

      // Cleanup temp files
      await cleanup([zipPath]);

      return {
        zipUrl: urlData.publicUrl,
        triggerWord: `ohwx_${avatarId.substring(0, 8)}`,
      };
    });

    // Step 3: Train LoRA model using FAL AI
    const loraResult = await step.run("train-lora", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("avatars")
        .update({
          metadata: {
            stage: "training",
            progress: 30,
          },
        })
        .eq("id", avatarId);

      // Train LoRA with FAL AI
      const result = await trainLora({
        images_data_url: zipData.zipUrl,
        trigger_word: zipData.triggerWord,
        steps: 1000,
      });

      return {
        lora_url: result.diffusers_lora_file.url,
        config_url: result.config_file.url,
        trigger_word: zipData.triggerWord,
      };
    });

    // Step 4: Generate preview images with trained LoRA
    const previewImages = await step.run("generate-previews", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("avatars")
        .update({
          metadata: {
            stage: "generating_previews",
            progress: 70,
          },
        })
        .eq("id", avatarId);

      // Generate 4 preview images with different prompts
      const prompts = [
        `${loraResult.trigger_word} professional portrait, studio lighting, high quality fashion photography`,
        `${loraResult.trigger_word} full body shot, walking pose, fashion runway, professional photography`,
        `${loraResult.trigger_word} headshot, natural smile, commercial photography style`,
        `${loraResult.trigger_word} elegant pose, editorial fashion, high-end magazine quality`,
      ];

      const imageResults = await Promise.all(
        prompts.map((prompt) =>
          generateFluxImage({
            prompt,
            image_size: { width: 768, height: 1024 },
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            loras: [
              {
                path: loraResult.lora_url,
                scale: 1.0,
              },
            ],
          })
        )
      );

      return imageResults.map((result) => result.images[0].url);
    });

    // Step 5: Save and finalize
    const savedAvatar = await step.run("finalize", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("avatars")
        .update({
          status: "completed",
          preview_images: previewImages,
          lora_weights_url: loraResult.lora_url,
          completed_at: new Date().toISOString(),
          metadata: {
            stage: "completed",
            progress: 100,
            lora_config_url: loraResult.config_url,
            trigger_word: loraResult.trigger_word,
            is_custom: true,
          },
        })
        .eq("id", avatarId);

      const { data: avatar } = await supabase
        .from("avatars")
        .select("*, user_profiles(*)")
        .eq("id", avatarId)
        .single();

      return avatar;
    });

    // Step 6: Send notification
    await step.run("send-notification", async () => {
      if (savedAvatar?.user_profiles?.email) {
        await sendAvatarCompleteEmail(savedAvatar.user_profiles.email, {
          userName: savedAvatar.user_profiles.display_name || "User",
          avatarName: savedAvatar.name,
          previewImages,
          avatarId,
          language: savedAvatar.user_profiles.preferred_language || "en",
        });
      }
    });

    return { success: true, avatarId, previewImages };
  }
);
