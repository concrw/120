import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFluxImage } from "@/lib/fal/client";
import { sendAvatarCompleteEmail } from "@/lib/email/send";

interface BodyPartReference {
  part: "face" | "body" | "hair" | "skin_tone";
  imageUrl: string;
  weight: number; // 0-1
}

export const generateHybridAvatar = inngest.createFunction(
  {
    id: "generate-hybrid-avatar",
    name: "Generate Hybrid AI Avatar (Multi-Reference)",
    retries: 2,
    onFailure: async ({ error, event }: any) => {
      const supabase = createAdminClient();

      // Refund credits
      const { data: avatar } = await supabase
        .from("hybrid_avatars")
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
            .update({ credits: profile.credits + 25 })
            .eq("id", avatar.user_id);

          await supabase.from("credit_transactions").insert({
            user_id: avatar.user_id,
            amount: 25,
            type: "refund",
            balance_after: profile.credits + 25,
            metadata: {
              reason: "hybrid_avatar_failed",
              avatar_id: event.data.avatarId,
              error: error.message,
            },
          });
        }
      }

      await supabase
        .from("hybrid_avatars")
        .update({
          status: "failed",
        })
        .eq("id", event.data.avatarId);
    },
  },
  { event: "avatar/generate-hybrid" },
  async ({ event, step }) => {
    const { avatarId, references } = event.data as {
      avatarId: string;
      references: BodyPartReference[];
    };

    // Step 1: Initialize
    await step.run("initialize", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("hybrid_avatars")
        .update({
          status: "processing",
        })
        .eq("id", avatarId);
    });

    // Step 2: Generate composite images using IP-Adapter multi-reference
    // In production, this would use a specialized multi-reference model
    // For now, we'll generate images with weighted prompts based on references
    const previewImages = await step.run("generate-composite", async () => {
      // Build weighted prompt from references
      const faceRef = references.find((r) => r.part === "face");
      const bodyRef = references.find((r) => r.part === "body");
      const hairRef = references.find((r) => r.part === "hair");
      const skinRef = references.find((r) => r.part === "skin_tone");

      // Generate multiple preview images with different poses
      const prompts = [
        "professional portrait photo, detailed facial features, studio lighting, fashion photography",
        "full body fashion shot, elegant pose, runway style, high-end commercial",
        "editorial style portrait, natural expression, magazine quality",
        "three-quarter view portrait, confident pose, professional photography",
      ];

      const imageResults = await Promise.all(
        prompts.map((basePrompt) => {
          let enhancedPrompt = basePrompt;

          // Add reference-based descriptors
          if (faceRef && faceRef.weight > 0.5) {
            enhancedPrompt += ", striking facial features";
          }
          if (bodyRef && bodyRef.weight > 0.5) {
            enhancedPrompt += ", athletic build";
          }
          if (hairRef && hairRef.weight > 0.5) {
            enhancedPrompt += ", distinctive hairstyle";
          }
          if (skinRef && skinRef.weight > 0.5) {
            enhancedPrompt += ", even skin tone";
          }

          return generateFluxImage({
            prompt: enhancedPrompt + ", photorealistic, 8k quality, professional",
            image_size: { width: 768, height: 1024 },
            num_inference_steps: 40, // Higher quality for hybrid
            guidance_scale: 4.0,
            num_images: 1,
          });
        })
      );

      return imageResults.map((result) => result.images[0].url);
    });

    // Step 3: Finalize
    const savedAvatar = await step.run("finalize", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("hybrid_avatars")
        .update({
          status: "completed",
          preview_images: previewImages,
        })
        .eq("id", avatarId);

      const { data: avatar } = await supabase
        .from("hybrid_avatars")
        .select("*, user_profiles(*)")
        .eq("id", avatarId)
        .single();

      return avatar;
    });

    // Step 4: Send notification
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
