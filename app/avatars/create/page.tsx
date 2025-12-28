"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CREATE_AVATAR_TRANSLATIONS } from "@/lib/i18n";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";

const AVATAR_STYLES = [
  {
    id: "realistic",
    preview: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "fashion",
    preview: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
    gradient: "from-blue-500 to-purple-500",
  },
  {
    id: "beauty",
    preview: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "editorial",
    preview: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "casual",
    preview: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
    gradient: "from-green-500 to-teal-500",
  },
];

function CreateAvatarForm() {
  const { language } = useLanguage();
  const t = CREATE_AVATAR_TRANSLATIONS[language];
  const [name, setName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch user credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("credits")
          .eq("id", user.id)
          .single();
        if (profile) {
          setCredits(profile.credits);
        }
      }
    };
    fetchCredits();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t.errorNameRequired);
      return;
    }

    if (!selectedStyle) {
      setError(t.errorStyleRequired);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(t.errorLoginRequired);
      }

      const { data: avatar, error: insertError } = await supabase
        .from("avatars")
        .insert({
          user_id: user.id,
          name: name.trim(),
          type: "preset",
          style: selectedStyle,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const triggerResponse = await fetch("/api/avatars/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarId: avatar.id }),
      });

      const triggerData = await triggerResponse.json();

      if (!triggerResponse.ok) {
        if (triggerResponse.status === 402) {
          setError(
            language === "ko"
              ? "크레딧이 부족합니다. 아바타 생성에는 10 크레딧이 필요합니다."
              : "Insufficient credits. Avatar generation requires 10 credits."
          );
          await supabase.from("avatars").delete().eq("id", avatar.id);
          return;
        }
        throw new Error(triggerData.error || "Failed to trigger avatar generation");
      }

      router.push("/avatars");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.errorCreateFailed);
    } finally {
      setLoading(false);
    }
  };

  const insufficientCredits = credits !== null && credits < 10;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass border-b border-secondary-200">
        <div className="container-default py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/avatars"
              className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-secondary-200 transition-colors"
            >
              <ArrowLeftIcon />
            </Link>
            <div>
              <h1 className="text-heading-md text-secondary-900">{t.title}</h1>
              <p className="text-body-sm text-secondary-500">
                {language === "ko" ? "AI 패션 모델을 생성합니다" : "Create your AI fashion model"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container-default py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">

          {/* Credit Info Banner */}
          {credits !== null && (
            <div className={`card p-4 flex items-center justify-between ${
              insufficientCredits ? "border-error-500 bg-error-50" : "border-primary-200 bg-primary-50"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  insufficientCredits ? "bg-error-100" : "bg-primary-100"
                }`}>
                  <CreditIcon className={`w-5 h-5 ${insufficientCredits ? "text-error-600" : "text-primary-600"}`} />
                </div>
                <div>
                  <p className="text-body-sm text-secondary-700">
                    {language === "ko" ? "현재 크레딧" : "Current Credits"}
                  </p>
                  <p className={`text-heading-md ${insufficientCredits ? "text-error-600" : "text-secondary-900"}`}>
                    {credits}
                    <span className="text-body-sm text-secondary-500 ml-2">
                      / 10 {language === "ko" ? "필요" : "required"}
                    </span>
                  </p>
                </div>
              </div>
              {insufficientCredits && (
                <Link href="/credits" className="btn-primary btn-sm">
                  {language === "ko" ? "크레딧 충전" : "Buy Credits"}
                </Link>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="card p-4 border-error-500 bg-error-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                  <AlertIcon className="w-5 h-5 text-error-600" />
                </div>
                <div className="flex-1">
                  <p className="text-body-md text-error-600">{error}</p>
                </div>
                {(error.includes("크레딧") || error.includes("credits")) && (
                  <Link href="/credits" className="btn-outline btn-sm border-error-500 text-error-600 hover:bg-error-50">
                    {language === "ko" ? "충전하기" : "Buy Credits"}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* 모델 이름 */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                1
              </div>
              <h2 className="text-heading-sm text-secondary-900">{t.modelName}</h2>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.modelNamePlaceholder}
              className="input"
              maxLength={50}
            />
            <p className="mt-2 text-body-sm text-secondary-500">
              {t.modelNameHelp}
            </p>
          </div>

          {/* 스타일 선택 */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                2
              </div>
              <h2 className="text-heading-sm text-secondary-900">{t.style}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    selectedStyle === style.id
                      ? "ring-2 ring-primary-500 ring-offset-2 scale-[1.02]"
                      : "hover:scale-[1.02]"
                  }`}
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={style.preview}
                      alt={t[style.id as keyof typeof t]}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${style.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />

                    {/* Selection indicator */}
                    {selectedStyle === style.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <h3 className="text-body-sm font-medium text-secondary-900">
                      {t[style.id as keyof typeof t]}
                    </h3>
                    <p className="text-caption text-secondary-500 line-clamp-2">
                      {t[`${style.id}Desc` as keyof typeof t]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 커스텀 모델 안내 */}
          <div className="card p-6 border-l-4 border-l-accent-500">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                <SparkleIcon className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h4 className="text-heading-sm text-secondary-900 mb-1">
                  {t.customModelsTitle}
                </h4>
                <p className="text-body-sm text-secondary-500">
                  {t.customModelsDesc}
                </p>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/avatars" className="flex-1 btn-secondary text-center">
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim() || !selectedStyle || insufficientCredits}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  {t.creating}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <SparkleIcon className="w-5 h-5" />
                  {t.createModel}
                </span>
              )}
            </button>
          </div>

          {/* 생성 안내 */}
          <div className="card p-6 bg-secondary-50">
            <h4 className="text-heading-sm text-secondary-900 mb-3">
              {language === "ko" ? "알아두세요" : "Good to know"}
            </h4>
            <ul className="space-y-2 text-body-sm text-secondary-600">
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
        </form>
      </main>
    </div>
  );
}

export default function CreateAvatarPage() {
  return (
    <LanguageProvider>
      <CreateAvatarForm />
    </LanguageProvider>
  );
}

// Icons
function ArrowLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472a4.265 4.265 0 01.264-.521z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
