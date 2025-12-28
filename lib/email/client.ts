import { Resend } from "resend";

// Only initialize Resend if API key is available
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const EMAIL_FROM = "AI Fashion Studio <noreply@aifashion.studio>";

export interface EmailTemplateData {
  userName: string;
  language?: "ko" | "en";
}

export interface VideoCompleteEmailData extends EmailTemplateData {
  videoThumbnail?: string;
  videoUrl: string;
  jobId: string;
}

export interface VideoFailedEmailData extends EmailTemplateData {
  errorMessage?: string;
  jobId: string;
}

export interface AvatarCompleteEmailData extends EmailTemplateData {
  avatarName: string;
  previewImages: string[];
  avatarId: string;
}

export interface WelcomeEmailData extends EmailTemplateData {
  credits: number;
}

export interface CreditsPurchasedEmailData extends EmailTemplateData {
  creditsAmount: number;
  newBalance: number;
  packageName: string;
}
