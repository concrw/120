import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractDWPose, generateFluxImage, generateVideo } from "@/lib/fal/client";
import { sendVideoCompleteEmail, sendVideoFailedEmail } from "@/lib/email/send";
import {
  createTempDir,
  cleanup,
  downloadVideo,
  extractFrames,
  extractThumbnail,
  framesToVideo,
} from "@/lib/video/ffmpeg";
import path from "path";

export const videoTransfer = inngest.createFunction(
  {
    id: "video-transfer",
    name: "Real Model Video Transfer",
    retries: 2,
    onFailure: async ({ error, event }: any) => {
      const supabase = createAdminClient();

      // Refund credits
      const { data: job } = await supabase
        .from("transfer_jobs")
        .select("user_id")
        .eq("id", event.data.jobId)
        .single();

      if (job) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("credits, email, display_name, preferred_language")
          .eq("id", job.user_id)
          .single();

        if (profile) {
          await supabase
            .from("user_profiles")
            .update({ credits: profile.credits + 30 })
            .eq("id", job.user_id);

          await supabase.from("credit_transactions").insert({
            user_id: job.user_id,
            amount: 30,
            type: "refund",
            balance_after: profile.credits + 30,
            metadata: {
              reason: "transfer_failed",
              job_id: event.data.jobId,
              error: error.message,
            },
          });

          // Send failure email
          if (profile.email) {
            await sendVideoFailedEmail(profile.email, {
              userName: profile.display_name || "User",
              errorMessage: error.message,
              jobId: event.data.jobId,
              language: profile.preferred_language || "en",
            });
          }
        }
      }

      await supabase
        .from("transfer_jobs")
        .update({
          status: "failed",
          error_message: error.message,
        })
        .eq("id", event.data.jobId);
    },
  },
  { event: "video/transfer" },
  async ({ event, step }) => {
    const { jobId, sourceVideoUrl, avatarId, productIds, keepBackground } = event.data;

    // Step 1: Download and extract video frames
    const videoData = await step.run("download-video", async () => {
      const supabase = createAdminClient();
      const tempDir = await createTempDir("video-transfer-");
      const videoPath = path.join(tempDir, "source.mp4");

      await supabase
        .from("transfer_jobs")
        .update({
          status: "extracting_pose",
          progress: 5,
        })
        .eq("id", jobId);

      // Download video
      await downloadVideo(sourceVideoUrl, videoPath);

      // Extract frames (1 fps for processing efficiency)
      const framesDir = path.join(tempDir, "frames");
      const framePaths = await extractFrames(videoPath, framesDir, {
        fps: 1, // 1 frame per second
        maxFrames: 30, // Max 30 frames (~30 seconds video)
        format: "png",
      });

      return {
        tempDir,
        framePaths,
        framesDir,
      };
    });

    // Step 2: Extract DWPose from first frame (simplified)
    const poseData = await step.run("extract-pose", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("transfer_jobs")
        .update({
          progress: 20,
        })
        .eq("id", jobId);

      // For now, only process first frame to save costs
      // In production: process all frames or key frames
      const firstFrame = videoData.framePaths[0];

      // Upload first frame to get public URL for FAL AI
      const fs = await import("fs/promises");
      const frameBuffer = await fs.readFile(firstFrame);
      const { data: uploadData } = await supabase.storage
        .from("transfer-videos")
        .upload(`${jobId}/first-frame.png`, frameBuffer, {
          contentType: "image/png",
        });

      const { data: urlData } = supabase.storage
        .from("transfer-videos")
        .getPublicUrl(uploadData!.path);

      const result = await extractDWPose({
        image_url: urlData.publicUrl,
        include_hands: true,
        include_face: true,
      });

      return {
        pose_url: result.image.url,
        frame_count: videoData.framePaths.length,
      };
    });

    // Step 2: Get avatar and product data
    const { avatar, products } = await step.run("load-assets", async () => {
      const supabase = createAdminClient();

      const { data: avatarData } = await supabase
        .from("avatars")
        .select("*")
        .eq("id", avatarId)
        .single();

      let productsData = [];
      if (productIds && productIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);
        productsData = data || [];
      }

      return { avatar: avatarData, products: productsData };
    });

    // Step 3: Generate first frame with avatar + products
    const generatedFrame = await step.run("generate-frame", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("transfer_jobs")
        .update({
          status: "generating",
          progress: 40,
        })
        .eq("id", jobId);

      // Build prompt with avatar trigger word and product descriptions
      let prompt = "";

      if (avatar.metadata?.trigger_word) {
        prompt += avatar.metadata.trigger_word + " ";
      }

      prompt += "professional fashion model, ";

      if (products.length > 0) {
        const productDesc = products.map((p: any) => p.name).join(", ");
        prompt += `wearing ${productDesc}, `;
      }

      prompt += "high quality commercial photography, full body shot";

      // Generate image with LoRA (if custom avatar)
      const loras = avatar.lora_weights_url
        ? [{ path: avatar.lora_weights_url, scale: 1.0 }]
        : undefined;

      const result = await generateFluxImage({
        prompt,
        image_size: { width: 1024, height: 1536 },
        num_inference_steps: 40,
        guidance_scale: 3.5,
        num_images: 1,
        loras,
      });

      return result.images[0].url;
    });

    // Step 4: Generate video from generated frame + pose
    const finalVideo = await step.run("animate-video", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("transfer_jobs")
        .update({
          progress: 70,
        })
        .eq("id", jobId);

      // Use video generation model
      const result = await generateVideo({
        image_url: generatedFrame,
        prompt: "smooth natural movement, professional fashion video, high quality",
        duration: "5",
        aspect_ratio: "9:16",
        cfg_scale: 0.5,
      });

      return result.video.url;
    });

    // Step 5: Finalize
    const savedJob = await step.run("finalize", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("transfer_jobs")
        .update({
          status: "completed",
          progress: 100,
          output_video_url: finalVideo,
          thumbnail_url: generatedFrame,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      const { data: job } = await supabase
        .from("transfer_jobs")
        .select("*, user_profiles(*)")
        .eq("id", jobId)
        .single();

      return job;
    });

    // Step 6: Send notification
    await step.run("send-notification", async () => {
      if (savedJob?.user_profiles?.email) {
        await sendVideoCompleteEmail(savedJob.user_profiles.email, {
          userName: savedJob.user_profiles.display_name || "User",
          videoUrl: finalVideo,
          videoThumbnail: generatedFrame,
          jobId,
          language: savedJob.user_profiles.preferred_language || "en",
        });
      }
    });

    return { success: true, jobId, videoUrl: finalVideo };
  }
);
