"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

const translations = {
  ko: {
    title: "베타 초대 코드",
    placeholder: "초대 코드 입력",
    button: "코드 사용하기",
    success: (credits: number) => `축하합니다! ${credits} 크레딧이 추가되었습니다.`,
    error: "유효하지 않거나 만료된 초대 코드입니다.",
    processing: "처리 중...",
  },
  en: {
    title: "Beta Invite Code",
    placeholder: "Enter invite code",
    button: "Redeem Code",
    success: (credits: number) => `Congratulations! ${credits} credits have been added.`,
    error: "Invalid or expired invite code.",
    processing: "Processing...",
  },
};

export default function BetaInviteRedemption() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/beta/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: t.success(data.bonus_credits),
        });
        setCode("");
      } else {
        setResult({
          success: false,
          message: data.error || t.error,
        });
      }
    } catch {
      setResult({
        success: false,
        message: t.error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-heading-sm text-secondary-900 mb-4">{t.title}</h3>

      <div className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t.placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl border border-secondary-200 bg-white text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-center tracking-widest"
          maxLength={8}
          disabled={loading}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t.processing : t.button}
        </button>
      </div>

      {result && (
        <div
          className={`mt-4 p-4 rounded-xl ${
            result.success
              ? "bg-success-50 text-success-700 border border-success-200"
              : "bg-error-50 text-error-700 border border-error-200"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
