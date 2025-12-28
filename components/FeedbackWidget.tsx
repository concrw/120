"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

const translations = {
  ko: {
    feedback: "피드백",
    title: "의견을 들려주세요",
    typeLabel: "유형",
    types: {
      bug: "버그 신고",
      feature: "기능 요청",
      general: "일반 의견",
      support: "도움 요청",
    },
    messageLabel: "내용",
    messagePlaceholder: "자세한 내용을 입력해주세요...",
    ratingLabel: "만족도",
    submit: "제출하기",
    submitting: "제출 중...",
    success: "피드백이 성공적으로 제출되었습니다. 감사합니다!",
    error: "피드백 제출에 실패했습니다. 다시 시도해주세요.",
    close: "닫기",
  },
  en: {
    feedback: "Feedback",
    title: "Share Your Feedback",
    typeLabel: "Type",
    types: {
      bug: "Bug Report",
      feature: "Feature Request",
      general: "General Feedback",
      support: "Support Request",
    },
    messageLabel: "Message",
    messagePlaceholder: "Please describe in detail...",
    ratingLabel: "Satisfaction",
    submit: "Submit",
    submitting: "Submitting...",
    success: "Thank you! Your feedback has been submitted.",
    error: "Failed to submit feedback. Please try again.",
    close: "Close",
  },
};

type FeedbackType = "bug" | "feature" | "general" | "support";

export default function FeedbackWidget() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          rating: rating || undefined,
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
          metadata: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            language,
          },
        }),
      });

      if (response.ok) {
        setResult({ success: true, message: t.success });
        setMessage("");
        setRating(0);
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: t.error });
      }
    } catch {
      setResult({ success: false, message: t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-strong flex items-center justify-center transition-all hover:scale-110 z-40"
        aria-label={t.feedback}
      >
        <FeedbackIcon className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-strong z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-100">
              <h3 className="text-heading-sm text-secondary-900">{t.title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-secondary-400 hover:text-secondary-600"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-body-sm font-medium text-secondary-700 mb-2 block">
                  {t.typeLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(t.types) as FeedbackType[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setType(key)}
                      className={`px-3 py-2 rounded-lg text-body-sm transition-colors ${
                        type === key
                          ? "bg-primary-100 text-primary-700 border-2 border-primary-500"
                          : "bg-secondary-50 text-secondary-600 border-2 border-transparent hover:bg-secondary-100"
                      }`}
                    >
                      {t.types[key]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-body-sm font-medium text-secondary-700 mb-2 block">
                  {t.messageLabel}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-secondary-200 bg-white text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-body-sm font-medium text-secondary-700 mb-2 block">
                  {t.ratingLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        star <= rating
                          ? "bg-yellow-100 text-yellow-500"
                          : "bg-secondary-50 text-secondary-300 hover:bg-secondary-100"
                      }`}
                    >
                      <StarIcon className="w-6 h-6 mx-auto" filled={star <= rating} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Message */}
              {result && (
                <div
                  className={`p-3 rounded-xl text-body-sm ${
                    result.success
                      ? "bg-success-50 text-success-700"
                      : "bg-error-50 text-error-700"
                  }`}
                >
                  {result.message}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.submitting : t.submit}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}
