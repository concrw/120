import { resend, EMAIL_FROM } from "./client";
import {
  getVideoCompleteEmail,
  getVideoFailedEmail,
  getAvatarCompleteEmail,
  getWelcomeEmail,
  getCreditsPurchasedEmail,
} from "./templates";
import type {
  VideoCompleteEmailData,
  VideoFailedEmailData,
  AvatarCompleteEmailData,
  WelcomeEmailData,
  CreditsPurchasedEmailData,
} from "./client";

export async function sendVideoCompleteEmail(to: string, data: VideoCompleteEmailData) {
  if (!resend) {
    console.warn("Email not configured: RESEND_API_KEY not set");
    return { success: false, error: "Email not configured" };
  }

  const { subject, html } = getVideoCompleteEmail(data);

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send video complete email:", error);
    return { success: false, error };
  }
}

export async function sendVideoFailedEmail(to: string, data: VideoFailedEmailData) {
  if (!resend) {
    console.warn("Email not configured: RESEND_API_KEY not set");
    return { success: false, error: "Email not configured" };
  }

  const { subject, html } = getVideoFailedEmail(data);

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send video failed email:", error);
    return { success: false, error };
  }
}

export async function sendAvatarCompleteEmail(to: string, data: AvatarCompleteEmailData) {
  if (!resend) {
    console.warn("Email not configured: RESEND_API_KEY not set");
    return { success: false, error: "Email not configured" };
  }

  const { subject, html } = getAvatarCompleteEmail(data);

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send avatar complete email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(to: string, data: WelcomeEmailData) {
  if (!resend) {
    console.warn("Email not configured: RESEND_API_KEY not set");
    return { success: false, error: "Email not configured" };
  }

  const { subject, html } = getWelcomeEmail(data);

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}

export async function sendCreditsPurchasedEmail(to: string, data: CreditsPurchasedEmailData) {
  if (!resend) {
    console.warn("Email not configured: RESEND_API_KEY not set");
    return { success: false, error: "Email not configured" };
  }

  const { subject, html } = getCreditsPurchasedEmail(data);

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send credits purchased email:", error);
    return { success: false, error };
  }
}
