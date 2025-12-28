import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Replicate from "replicate";
import { sendVideoCompleteEmail, sendVideoFailedEmail } from "@/lib/email/send";

export const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    name: "Generate Fashion Video",
    retries: 3,
    onFailure: async ({ error, event }: any) => {
      const supabase = createAdminClient();

      // Get job and user info for email
      const { data: job } = await supabase
        .from("jobs")
        .select("*, user_profiles(*)")
        .eq("id", event.data.jobId)
        .single();

      await supabase
        .from("jobs")
        .update({
          status: "failed",
          error_message: error.message,
        })
        .eq("id", event.data.jobId);

      // Send failure email notification
      if (job?.user_profiles?.email) {
        await sendVideoFailedEmail(job.user_profiles.email, {
          userName: job.user_profiles.display_name || "User",
          jobId: event.data.jobId,
          errorMessage: error.message,
          language: job.user_profiles.preferred_language || "en",
        });
      }
    },
  },
  { event: "video/generate" },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // Step 1: Generate prompt with GPT-4
    const prompt = await step.run("generate-prompt", async () => {
      const supabase = await createClient();

      // Update job status
      await supabase
        .from("jobs")
        .update({
          status: "processing",
          current_step: "Generating prompt",
          progress: 10,
        })
        .eq("id", jobId);

      // Fetch job details
      const { data: job } = await supabase
        .from("jobs")
        .select(
          `
          *,
          avatars(*),
          products(*)
        `
        )
        .eq("id", jobId)
        .single();

      if (!job) {
        throw new Error("Job not found");
      }

      // Generate prompt using GPT-4
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert fashion photography prompt generator for AI image generation.
Generate a detailed, cinematic prompt for a fashion scene based on the provided information.
Focus on lighting, composition, mood, and product details.`,
            },
            {
              role: "user",
              content: `Generate a prompt for:
- Model: ${job.avatars.name}
- Product: ${job.products.name} (${job.products.type})
- Background: ${job.background_id}
- Action: ${job.action_type}
- Video size: ${job.video_size}

The scene should be professional, cinematic, and highlight the product clearly.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      const generatedPrompt = data.choices[0].message.content;

      // Save prompt to job
      await supabase
        .from("jobs")
        .update({
          metadata: {
            ...job.metadata,
            generated_prompt: generatedPrompt,
          },
        })
        .eq("id", jobId);

      return generatedPrompt;
    });

    // Step 2: Generate scene image with Stable Diffusion
    const sceneImageUrl = await step.run("generate-scene-image", async () => {
      const supabase = await createClient();

      await supabase
        .from("jobs")
        .update({
          current_step: "Generating scene image",
          progress: 30,
        })
        .eq("id", jobId);

      // Fetch job details for avatar image
      const { data: job } = await supabase
        .from("jobs")
        .select(
          `
          *,
          avatars(image_urls),
          products(*)
        `
        )
        .eq("id", jobId)
        .single();

      if (!job) {
        throw new Error("Job not found");
      }

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!,
      });

      // Use SDXL for image generation
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: `${prompt}, professional fashion photography, high quality, 8k uhd, hyper detailed`,
            negative_prompt:
              "ugly, deformed, noisy, blurry, distorted, low quality, worst quality, watermark, text",
            width: job.video_size === "1:1" ? 1024 : job.video_size === "16:9" ? 1344 : 1024,
            height: job.video_size === "1:1" ? 1024 : job.video_size === "16:9" ? 768 : 1344,
            num_outputs: 1,
            scheduler: "DPMSolverMultistep",
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        }
      );

      const imageUrl = Array.isArray(output) ? output[0] : output;

      // Save image URL to job metadata
      await supabase
        .from("jobs")
        .update({
          metadata: {
            ...job.metadata,
            scene_image_url: imageUrl,
          },
        })
        .eq("id", jobId);

      return imageUrl as string;
    });

    // Step 3: Quality check
    const qualityPassed = await step.run("quality-check", async () => {
      const supabase = await createClient();

      await supabase
        .from("jobs")
        .update({
          current_step: "Quality check",
          progress: 50,
        })
        .eq("id", jobId);

      // Use GPT-4 Vision to check image quality
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this fashion image and rate its quality from 0-100 based on:
- Image clarity and sharpness
- Proper lighting and composition
- Professional fashion photography standards
- Product visibility
- Overall aesthetic quality

Respond with ONLY a number from 0-100.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: sceneImageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 10,
        }),
      });

      const data = await response.json();
      const qualityScore = parseInt(data.choices[0].message.content.trim());

      // Save quality score to metadata
      await supabase
        .from("jobs")
        .update({
          metadata: {
            quality_score: qualityScore,
          },
        })
        .eq("id", jobId);

      // Pass if quality score >= 90
      return qualityScore >= 90;
    });

    if (!qualityPassed) {
      throw new Error("Quality check failed - will retry");
    }

    // Step 4: Generate video with Replicate (alternative to Veo)
    const videoUrl = await step.run("generate-video", async () => {
      const supabase = await createClient();

      await supabase
        .from("jobs")
        .update({
          current_step: "Generating video",
          progress: 70,
        })
        .eq("id", jobId);

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!,
      });

      // Use Stable Video Diffusion for image-to-video
      const output = await replicate.run(
        "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
        {
          input: {
            input_image: sceneImageUrl,
            fps: 6,
            motion_bucket_id: 127,
            cond_aug: 0.02,
            decoding_t: 14,
            video_length: 14,
          },
        }
      );

      const videoOutputUrl = Array.isArray(output) ? output[0] : output;

      // Save video URL to job metadata
      await supabase
        .from("jobs")
        .update({
          metadata: {
            video_output_url: videoOutputUrl,
          },
        })
        .eq("id", jobId);

      return videoOutputUrl as string;
    });

    // Step 5: Post-processing and completion
    const finalResult = await step.run("finalize", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("jobs")
        .update({
          current_step: "Finalizing",
          progress: 90,
        })
        .eq("id", jobId);

      // Use the scene image as thumbnail (already generated and high quality)
      const thumbnailUrl = sceneImageUrl;

      // Mark job as completed
      await supabase
        .from("jobs")
        .update({
          status: "completed",
          progress: 100,
          output_video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      // Get user info for email notification
      const { data: job } = await supabase
        .from("jobs")
        .select("user_id")
        .eq("id", jobId)
        .single();

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("email, display_name, preferred_language")
        .eq("id", job?.user_id)
        .single();

      return { videoUrl, thumbnailUrl, userProfile };
    });

    // Step 6: Send email notification
    await step.run("send-notification", async () => {
      if (finalResult.userProfile?.email) {
        await sendVideoCompleteEmail(finalResult.userProfile.email, {
          userName: finalResult.userProfile.display_name || "User",
          videoUrl: finalResult.videoUrl,
          videoThumbnail: finalResult.thumbnailUrl,
          jobId,
          language: finalResult.userProfile.preferred_language || "en",
        });
      }
    });

    return { success: true, jobId, videoUrl };
  }
);
