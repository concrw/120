import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateVideo } from "@/lib/inngest/functions/generate-video";
import { generateAvatar } from "@/lib/inngest/functions/generate-avatar";
import { generateCustomAvatar } from "@/lib/inngest/functions/generate-custom-avatar";
import { generateHybridAvatar } from "@/lib/inngest/functions/generate-hybrid-avatar";
import { videoTransfer } from "@/lib/inngest/functions/video-transfer";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateVideo,
    generateAvatar,
    generateCustomAvatar,
    generateHybridAvatar,
    videoTransfer,
  ],
});
