"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CREDITS_TRANSLATIONS } from "@/lib/i18n";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";

const CREDIT_PACKAGES = [
  {
    id: "starter",
    credits: 25,
    price: 15,
    videos: 5,
    icon: "🎬",
  },
  {
    id: "popular",
    credits: 50,
    price: 25,
    videos: 10,
    badge: "mostPopular",
    icon: "⭐",
  },
  {
    id: "pro",
    credits: 100,
    price: 45,
    videos: 20,
    badge: "bestValue",
    icon: "🚀",
  },
];

function CreditsPageContent() {
  const { language } = useLanguage();
  const t = CREDITS_TRANSLATIONS[language];
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        setCredits(profile?.credits || 0);
      } catch (err) {
        console.error("Failed to load credits:", err);
      }
    };

    loadCredits();

    const successParam = searchParams?.get("success");
    const canceledParam = searchParams?.get("canceled");

    if (successParam === "true") {
      setSuccess(language === "ko"
        ? "결제가 완료되었습니다! 크레딧이 계정에 추가되었습니다."
        : "Payment successful! Credits have been added to your account.");
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    } else if (canceledParam === "true") {
      setError(language === "ko" ? "결제가 취소되었습니다." : "Payment was canceled.");
      const url = new URL(window.location.href);
      url.searchParams.delete("canceled");
      window.history.replaceState({}, "", url.toString());
    }
  }, [supabase, searchParams, language]);

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(t.errorPurchaseFailed);
      }

      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorPurchaseFailed);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.errorPurchaseFailed;
      setError(errorMessage);
      setLoading(null);
    }
  };

  const hasLowCredits = credits < 20;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="border-b border-secondary-200 sticky top-0 z-50 bg-white/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="w-10 h-10 rounded-xl bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-secondary-600" />
              </Link>
              <div>
                <h1 className="text-heading-md text-secondary-900">{t.title}</h1>
                <p className="text-body-sm text-secondary-500">{t.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Success message */}
        {success && (
          <div className="mb-6 card p-4 border-l-4 border-l-success-500 bg-success-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-success-600" />
              </div>
              <p className="text-body-sm text-success-700">{success}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 card p-4 border-l-4 border-l-error-500 bg-error-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-error-100 flex items-center justify-center">
                <span className="text-error-600 font-bold">!</span>
              </div>
              <p className="text-body-sm text-error-700">{error}</p>
            </div>
          </div>
        )}

        {/* Current balance card */}
        <div className={`card p-6 mb-8 ${hasLowCredits ? "border-l-4 border-l-warning-500" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-secondary-500 mb-1">{t.currentBalance}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-display-sm font-bold text-secondary-900 font-mono">
                  {credits}
                </span>
                <span className="text-body-md text-secondary-400">{t.credits}</span>
              </div>
              {hasLowCredits && (
                <p className="text-caption text-warning-600 mt-2">
                  {language === "ko"
                    ? "크레딧이 부족합니다. 영상을 생성하려면 20 크레딧이 필요합니다."
                    : "Low credits. You need 20 credits to generate a video."}
                </p>
              )}
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              hasLowCredits ? "bg-warning-100" : "bg-primary-100"
            }`}>
              <CreditIcon className={`w-8 h-8 ${hasLowCredits ? "text-warning-600" : "text-primary-600"}`} />
            </div>
          </div>
        </div>

        {/* Package selection */}
        <div className="mb-8">
          <h2 className="text-heading-md text-secondary-900 mb-6">{t.selectPackage}</h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`card overflow-hidden transition-all hover:shadow-medium ${
                  pkg.badge === "mostPopular"
                    ? "ring-2 ring-primary-500 ring-offset-2"
                    : ""
                }`}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div className={`py-2 text-center text-xs font-bold tracking-wide ${
                    pkg.badge === "mostPopular"
                      ? "bg-primary-600 text-white"
                      : "bg-accent-500 text-white"
                  }`}>
                    {t[pkg.badge as keyof typeof t]}
                  </div>
                )}

                {/* Package content */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                      {pkg.icon}
                    </div>
                    <div className="text-display-xs font-bold text-secondary-900 mb-1">
                      {t.creditCount.replace("{count}", pkg.credits.toString())}
                    </div>
                    <div className="text-body-sm text-secondary-500">
                      {t.perVideo.replace("{count}", pkg.videos.toString())}
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-display-sm font-bold text-secondary-900">
                      {t.price.replace("{price}", pkg.price.toString())}
                    </div>
                    <div className="text-caption text-secondary-400">
                      ${(pkg.price / pkg.credits).toFixed(2)} / credit
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading !== null}
                    className={`w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      pkg.badge === "mostPopular"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                  >
                    {loading === pkg.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner />
                        {t.purchasing}
                      </span>
                    ) : (
                      t.purchaseButton
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing info */}
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <InfoIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-heading-sm text-secondary-900 mb-2">
                {t.pricingInfo}
              </h4>
              <ul className="space-y-1.5 text-body-sm text-secondary-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine3}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine4}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← {language === "ko" ? "대시보드로 돌아가기" : "Back to Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
            <LoadingSpinner className="w-8 h-8 text-primary-600" />
          </div>
        }
      >
        <CreditsPageContent />
      </Suspense>
    </LanguageProvider>
  );
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
