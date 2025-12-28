import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import Replicate from "replicate";
import { sendAvatarCompleteEmail } from "@/lib/email/send";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const STYLE_PROMPTS = {
  realistic: "professional headshot, realistic photography, natural lighting, elegant woman, detailed facial features, commercial photography style",
  fashion: "high fashion model, editorial photography, dramatic lighting, elegant pose, vogue style, sophisticated beauty",
  beauty: "beauty photography, soft lighting, flawless skin, professional makeup, cosmetic advertisement style",
  editorial: "editorial fashion photography, artistic lighting, creative composition, magazine cover style",
  casual: "casual lifestyle photography, natural beauty, soft natural lighting, approachable friendly style",
};

export const generateAvatar = inngest.createFunction(
  {
    id: "generate-avatar",
    name: "Generate AI Avatar",
    retries: 3,
    onFailure: async ({ error, event }: any) => {
      const supabase = createAdminClient();
      await supabase
        .from("avatars")
        .update({
          status: "failed",
          metadata: { error_message: error.message },
        })
        .eq("id", event.data.avatarId);
    },
  },
  { event: "avatar/generate" },
  async ({ event, step }) => {
    const { avatarId } = event.data;

    // Step 1: Fetch avatar details
    const avatarData = await step.run("fetch-avatar", async () => {
      const supabase = createAdminClient();

      const { data: avatar } = await supabase
        .from("avatars")
        .select("*")
        .eq("id", avatarId)
        .single();

      if (!avatar) {
        throw new Error("Avatar not found");
      }

      // Update status to processing
      await supabase
        .from("avatars")
        .update({ status: "processing" })
        .eq("id", avatarId);

      return avatar;
    });

    // Step 2: Generate images with Replicate (SDXL)
    const images = await step.run("generate-images", async () => {
      const prompt = STYLE_PROMPTS[avatarData.style as keyof typeof STYLE_PROMPTS];

      // Generate 4 variations using SDXL
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: `${prompt}, professional quality, 8k uhd, hyper detailed`,
            negative_prompt: "ugly, deformed, noisy, blurry, distorted, low quality, worst quality",
            width: 1024,
            height: 1536,
            num_outputs: 4,
            scheduler: "K_EULER",
            num_inference_steps: 50,
            guidance_scale: 7.5,
          },
        }
      ) as string[];

      return output;
    });

    // Step 3: Save images to database
    const savedAvatar = await step.run("save-images", async () => {
      const supabase = createAdminClient();

      await supabase
        .from("avatars")
        .update({
          status: "completed",
          preview_images: images,
          completed_at: new Date().toISOString(),
        })
        .eq("id", avatarId);

      // Get avatar with user info for email
      const { data: avatar } = await supabase
        .from("avatars")
        .select("*, user_profiles(*)")
        .eq("id", avatarId)
        .single();

      return avatar;
    });

    // Step 4: Send email notification
    await step.run("send-notification", async () => {
      if (savedAvatar?.user_profiles?.email) {
        await sendAvatarCompleteEmail(savedAvatar.user_profiles.email, {
          userName: savedAvatar.user_profiles.display_name || "User",
          avatarName: savedAvatar.name,
          previewImages: images,
          avatarId,
          language: savedAvatar.user_profiles.preferred_language || "en",
        });
      }
    });

    return { success: true, avatarId, images };
  }
);
