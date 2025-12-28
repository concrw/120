import {
  VideoCompleteEmailData,
  VideoFailedEmailData,
  AvatarCompleteEmailData,
  WelcomeEmailData,
  CreditsPurchasedEmailData,
} from "./client";

const getBaseStyles = () => `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { padding: 32px; }
  .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .button:hover { background: #5855e0; }
  .footer { background: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
  .thumbnail { width: 100%; border-radius: 12px; margin: 16px 0; }
  .preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 16px 0; }
  .preview-img { width: 100%; border-radius: 8px; }
  .stat-box { background: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin: 8px 0; }
  .stat-value { font-size: 32px; font-weight: bold; color: #6366f1; }
  .stat-label { color: #64748b; font-size: 14px; }
`;

const translations = {
  ko: {
    videoComplete: {
      subject: "영상 생성이 완료되었습니다! 🎬",
      title: "영상 생성 완료",
      greeting: (name: string) => `안녕하세요, ${name}님!`,
      message: "요청하신 AI 패션 영상이 성공적으로 생성되었습니다.",
      button: "영상 확인하기",
      footer: "AI Fashion Studio에서 발송된 이메일입니다.",
    },
    videoFailed: {
      subject: "영상 생성 실패 안내 😢",
      title: "영상 생성 실패",
      greeting: (name: string) => `안녕하세요, ${name}님!`,
      message: "죄송합니다. 영상 생성 중 문제가 발생했습니다.",
      errorLabel: "오류 내용:",
      retryMessage: "크레딧은 차감되지 않았습니다. 다시 시도해 주세요.",
      button: "다시 시도하기",
      footer: "AI Fashion Studio에서 발송된 이메일입니다.",
    },
    avatarComplete: {
      subject: "AI 모델이 생성되었습니다! ✨",
      title: "AI 모델 생성 완료",
      greeting: (name: string) => `안녕하세요, ${name}님!`,
      message: (avatarName: string) => `'${avatarName}' AI 모델이 성공적으로 생성되었습니다.`,
      previewTitle: "생성된 프리뷰 이미지:",
      button: "모델 확인하기",
      footer: "AI Fashion Studio에서 발송된 이메일입니다.",
    },
    welcome: {
      subject: "AI Fashion Studio에 오신 것을 환영합니다! 🎉",
      title: "환영합니다!",
      greeting: (name: string) => `안녕하세요, ${name}님!`,
      message: "AI Fashion Studio에 가입해 주셔서 감사합니다.",
      creditsLabel: "시작 크레딧",
      creditsUnit: "크레딧",
      tipTitle: "시작하기 팁:",
      tips: [
        "AI 모델을 생성하세요 (10 크레딧)",
        "제품 이미지를 업로드하세요",
        "마케팅 영상을 생성하세요 (20 크레딧)",
      ],
      button: "시작하기",
      footer: "AI Fashion Studio에서 발송된 이메일입니다.",
    },
    creditsPurchased: {
      subject: "크레딧 충전이 완료되었습니다! 💰",
      title: "크레딧 충전 완료",
      greeting: (name: string) => `안녕하세요, ${name}님!`,
      message: (pkg: string) => `${pkg} 패키지 구매가 완료되었습니다.`,
      purchasedLabel: "충전된 크레딧",
      balanceLabel: "현재 잔액",
      creditsUnit: "크레딧",
      button: "영상 만들기",
      footer: "AI Fashion Studio에서 발송된 이메일입니다.",
    },
  },
  en: {
    videoComplete: {
      subject: "Your video is ready! 🎬",
      title: "Video Generation Complete",
      greeting: (name: string) => `Hello, ${name}!`,
      message: "Your AI fashion video has been successfully generated.",
      button: "View Video",
      footer: "This email was sent from AI Fashion Studio.",
    },
    videoFailed: {
      subject: "Video generation failed 😢",
      title: "Video Generation Failed",
      greeting: (name: string) => `Hello, ${name}!`,
      message: "We're sorry, but there was an issue generating your video.",
      errorLabel: "Error details:",
      retryMessage: "Your credits have not been deducted. Please try again.",
      button: "Try Again",
      footer: "This email was sent from AI Fashion Studio.",
    },
    avatarComplete: {
      subject: "Your AI model is ready! ✨",
      title: "AI Model Generation Complete",
      greeting: (name: string) => `Hello, ${name}!`,
      message: (avatarName: string) => `Your AI model '${avatarName}' has been successfully generated.`,
      previewTitle: "Generated preview images:",
      button: "View Model",
      footer: "This email was sent from AI Fashion Studio.",
    },
    welcome: {
      subject: "Welcome to AI Fashion Studio! 🎉",
      title: "Welcome!",
      greeting: (name: string) => `Hello, ${name}!`,
      message: "Thank you for joining AI Fashion Studio.",
      creditsLabel: "Starting Credits",
      creditsUnit: "credits",
      tipTitle: "Getting Started Tips:",
      tips: [
        "Create an AI model (10 credits)",
        "Upload your product images",
        "Generate marketing videos (20 credits)",
      ],
      button: "Get Started",
      footer: "This email was sent from AI Fashion Studio.",
    },
    creditsPurchased: {
      subject: "Credits purchased successfully! 💰",
      title: "Credits Purchase Complete",
      greeting: (name: string) => `Hello, ${name}!`,
      message: (pkg: string) => `Your ${pkg} package purchase is complete.`,
      purchasedLabel: "Credits Added",
      balanceLabel: "Current Balance",
      creditsUnit: "credits",
      button: "Create Video",
      footer: "This email was sent from AI Fashion Studio.",
    },
  },
};

export function getVideoCompleteEmail(data: VideoCompleteEmailData) {
  const t = translations[data.language || "en"].videoComplete;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifashion.studio";

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head><style>${getBaseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>${t.title}</h1></div>
    <div class="content">
      <p>${t.greeting(data.userName)}</p>
      <p>${t.message}</p>
      ${data.videoThumbnail ? `<img src="${data.videoThumbnail}" alt="Video Thumbnail" class="thumbnail" />` : ""}
      <div style="text-align: center;">
        <a href="${appUrl}/library?highlight=${data.jobId}" class="button">${t.button}</a>
      </div>
    </div>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>`,
  };
}

export function getVideoFailedEmail(data: VideoFailedEmailData) {
  const t = translations[data.language || "en"].videoFailed;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifashion.studio";

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head><style>${getBaseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);"><h1>${t.title}</h1></div>
    <div class="content">
      <p>${t.greeting(data.userName)}</p>
      <p>${t.message}</p>
      ${data.errorMessage ? `<div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;"><strong>${t.errorLabel}</strong><br/>${data.errorMessage}</div>` : ""}
      <p>${t.retryMessage}</p>
      <div style="text-align: center;">
        <a href="${appUrl}/create" class="button" style="background: #ef4444;">${t.button}</a>
      </div>
    </div>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>`,
  };
}

export function getAvatarCompleteEmail(data: AvatarCompleteEmailData) {
  const t = translations[data.language || "en"].avatarComplete;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifashion.studio";

  const previewImagesHtml = data.previewImages
    .slice(0, 4)
    .map((url) => `<img src="${url}" alt="Preview" class="preview-img" />`)
    .join("");

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head><style>${getBaseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>${t.title}</h1></div>
    <div class="content">
      <p>${t.greeting(data.userName)}</p>
      <p>${t.message(data.avatarName)}</p>
      <p><strong>${t.previewTitle}</strong></p>
      <div class="preview-grid">${previewImagesHtml}</div>
      <div style="text-align: center;">
        <a href="${appUrl}/avatars?highlight=${data.avatarId}" class="button">${t.button}</a>
      </div>
    </div>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>`,
  };
}

export function getWelcomeEmail(data: WelcomeEmailData) {
  const t = translations[data.language || "en"].welcome;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifashion.studio";

  const tipsHtml = t.tips.map((tip) => `<li style="margin: 8px 0;">${tip}</li>`).join("");

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head><style>${getBaseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>${t.title}</h1></div>
    <div class="content">
      <p>${t.greeting(data.userName)}</p>
      <p>${t.message}</p>
      <div class="stat-box">
        <div class="stat-value">${data.credits}</div>
        <div class="stat-label">${t.creditsLabel}</div>
      </div>
      <p><strong>${t.tipTitle}</strong></p>
      <ul style="color: #64748b; line-height: 1.8;">${tipsHtml}</ul>
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard" class="button">${t.button}</a>
      </div>
    </div>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>`,
  };
}

export function getCreditsPurchasedEmail(data: CreditsPurchasedEmailData) {
  const t = translations[data.language || "en"].creditsPurchased;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifashion.studio";

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head><style>${getBaseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>${t.title}</h1></div>
    <div class="content">
      <p>${t.greeting(data.userName)}</p>
      <p>${t.message(data.packageName)}</p>
      <div style="display: flex; gap: 16px; margin: 24px 0;">
        <div class="stat-box" style="flex: 1;">
          <div class="stat-value" style="color: #10b981;">+${data.creditsAmount}</div>
          <div class="stat-label">${t.purchasedLabel}</div>
        </div>
        <div class="stat-box" style="flex: 1;">
          <div class="stat-value">${data.newBalance}</div>
          <div class="stat-label">${t.balanceLabel}</div>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/create" class="button">${t.button}</a>
      </div>
    </div>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>`,
  };
}
