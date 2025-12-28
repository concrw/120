import { fal } from "@fal-ai/client";

export { fal };

// FAL AI 모델 엔드포인트
export const FAL_MODELS = {
  // LoRA 학습
  TRAIN_LORA: "fal-ai/flux-lora-fast-training",

  // 이미지 생성 (LoRA 적용 가능)
  FLUX_PRO: "fal-ai/flux-pro/v1.1",
  FLUX_DEV: "fal-ai/flux/dev",

  // 영상 생성
  VIDEO_GEN: "fal-ai/kling-video/v1/standard/image-to-video",

  // DWPose 추출 (동작 캡처)
  DWPOSE: "fal-ai/fast-dwpose",

  // 배경 제거
  REMOVE_BG: "fal-ai/birefnet/v2",
} as const;

// LoRA 학습 요청 타입
export interface TrainLoRARequest {
  images_data_url: string; // zip file with training images
  trigger_word: string;
  steps?: number; // 기본 1000
  learning_rate?: number;
}

export interface TrainLoRAResponse {
  diffusers_lora_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  config_file: {
    url: string;
  };
}

// Flux 이미지 생성 요청 타입
export interface FluxImageRequest {
  prompt: string;
  image_size?: {
    width: number;
    height: number;
  };
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  loras?: Array<{
    path: string; // LoRA weights URL
    scale?: number; // 0-1
  }>;
  seed?: number;
}

export interface FluxImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

// 영상 생성 요청 타입
export interface VideoGenRequest {
  image_url: string;
  prompt: string;
  duration?: "5" | "10"; // seconds
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  cfg_scale?: number;
  seed?: number;
}

export interface VideoGenResponse {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

// DWPose 추출 요청
export interface DWPoseRequest {
  image_url: string;
  include_hands?: boolean;
  include_face?: boolean;
}

export interface DWPoseResponse {
  image: {
    url: string;
    content_type: string;
  };
}

// 배경 제거 요청
export interface RemoveBGRequest {
  image_url: string;
}

export interface RemoveBGResponse {
  image: {
    url: string;
    content_type: string;
  };
}

// FAL AI 헬퍼 함수들
export async function trainLora(request: TrainLoRARequest): Promise<TrainLoRAResponse> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable not set");
  }

  // Configure fal client
  fal.config({
    credentials: process.env.FAL_KEY,
  });

  const result = await fal.subscribe(FAL_MODELS.TRAIN_LORA, {
    input: {
      images_data_url: request.images_data_url,
      trigger_word: request.trigger_word,
      steps: request.steps || 1000,
    },
    logs: true,
    onQueueUpdate: (update) => {
      console.log("[LoRA Training Queue]", update.status);
    },
  });

  return result.data as TrainLoRAResponse;
}

export async function generateFluxImage(request: FluxImageRequest): Promise<FluxImageResponse> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable not set");
  }

  fal.config({
    credentials: process.env.FAL_KEY,
  });

  // Use FLUX_DEV if LoRAs are provided (FLUX_PRO doesn't support LoRAs)
  const model = request.loras && request.loras.length > 0 ? FAL_MODELS.FLUX_DEV : FAL_MODELS.FLUX_PRO;

  // Build input based on model
  const input: any = {
    prompt: request.prompt,
    image_size: request.image_size || { width: 1024, height: 1024 },
    num_images: request.num_images || 1,
    seed: request.seed,
    enable_safety_checker: true,
  };

  // Add LoRAs only for FLUX_DEV
  if (model === FAL_MODELS.FLUX_DEV && request.loras) {
    input.loras = request.loras;
  }

  const result = await fal.subscribe(model, {
    input,
    logs: false,
  });

  return result.data as FluxImageResponse;
}

export async function generateVideo(request: VideoGenRequest): Promise<VideoGenResponse> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable not set");
  }

  fal.config({
    credentials: process.env.FAL_KEY,
  });

  const result = await fal.subscribe(FAL_MODELS.VIDEO_GEN, {
    input: {
      image_url: request.image_url,
      prompt: request.prompt,
      duration: request.duration || "5",
    },
    logs: true,
    onQueueUpdate: (update) => {
      console.log("[Video Generation Queue]", update.status);
    },
  });

  return result.data as VideoGenResponse;
}

export async function extractDWPose(request: DWPoseRequest): Promise<DWPoseResponse> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable not set");
  }

  fal.config({
    credentials: process.env.FAL_KEY,
  });

  const result = await fal.run(FAL_MODELS.DWPOSE, {
    input: {
      image_url: request.image_url,
      include_hands: request.include_hands ?? true,
      include_face: request.include_face ?? true,
    },
  });

  return result.data as DWPoseResponse;
}

export async function removeBG(request: RemoveBGRequest): Promise<RemoveBGResponse> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable not set");
  }

  fal.config({
    credentials: process.env.FAL_KEY,
  });

  const result = await fal.run(FAL_MODELS.REMOVE_BG, {
    input: {
      image_url: request.image_url,
    },
  });

  return result.data as RemoveBGResponse;
}
