"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CREATE_VIDEO_TRANSLATIONS } from "@/lib/i18n";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";

const VIDEO_SIZES = [
  {
    id: "vertical",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    icon: "📱",
  },
  {
    id: "horizontal",
    ratio: "16:9",
    width: 1920,
    height: 1080,
    icon: "🖥️",
  },
];

const BACKGROUNDS = [
  { id: "urbanStreet", icon: "🏙️" },
  { id: "beachSunset", icon: "🏖️" },
  { id: "studioWhite", icon: "📸" },
  { id: "cafeInterior", icon: "☕" },
  { id: "naturePark", icon: "🌳" },
];

const ACTIONS = [
  { id: "walk", icon: "🚶" },
  { id: "standPose", icon: "🧍" },
  { id: "turn", icon: "🔄" },
  { id: "casualMovement", icon: "💃" },
];

function CreateVideoFormInner() {
  const { language } = useLanguage();
  const t = CREATE_VIDEO_TRANSLATIONS[language];
  const [avatars, setAvatars] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState("vertical");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBackground, setSelectedBackground] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: avatarsData } = await supabase
          .from("avatars")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        setAvatars(avatarsData || []);

        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setProducts(productsData || []);

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        setCredits(profile?.credits || 0);

        const avatarParam = searchParams?.get("avatar");
        const productParam = searchParams?.get("product");

        if (avatarParam) setSelectedAvatar(avatarParam);
        if (productParam) setSelectedProduct(productParam);
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    };

    loadData();
  }, [supabase, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedSize) {
      setError(t.errorSizeRequired);
      return;
    }

    if (!selectedAvatar) {
      setError(t.errorModelRequired);
      return;
    }

    if (!selectedProduct) {
      setError(t.errorProductRequired);
      return;
    }

    if (!selectedBackground) {
      setError(t.errorBackgroundRequired);
      return;
    }

    if (!selectedAction) {
      setError(t.errorActionRequired);
      return;
    }

    const REQUIRED_CREDITS = 20;
    if (credits < REQUIRED_CREDITS) {
      setError(
        language === "ko"
          ? `크레딧이 부족합니다. 비디오 생성에는 ${REQUIRED_CREDITS} 크레딧이 필요합니다. (현재: ${credits})`
          : `Insufficient credits. Video generation requires ${REQUIRED_CREDITS} credits. (Available: ${credits})`
      );
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

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          avatar_ids: [selectedAvatar],
          product_id: selectedProduct,
          background_type: "preset",
          background_id: selectedBackground,
          action_type: selectedAction,
          video_size: selectedSize,
          status: "pending",
          progress: 0,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const triggerResponse = await fetch("/api/jobs/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      const triggerData = await triggerResponse.json();

      if (!triggerResponse.ok) {
        if (triggerResponse.status === 402) {
          await supabase.from("jobs").delete().eq("id", job.id);
          setError(
            language === "ko"
              ? "크레딧이 부족합니다. 비디오 생성에는 20 크레딧이 필요합니다."
              : "Insufficient credits. Video generation requires 20 credits."
          );
          return;
        }
        throw new Error(triggerData.error || "Failed to trigger video generation");
      }

      setCredits(triggerData.creditsRemaining);

      router.push(`/library?highlight=${job.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.errorGenerationFailed);
    } finally {
      setLoading(false);
    }
  };

  const selectedSizeInfo = VIDEO_SIZES.find((s) => s.id === selectedSize);
  const isFormValid = selectedSize && selectedAvatar && selectedProduct && selectedBackground && selectedAction;
  const hasInsufficientCredits = credits < 20;

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-display-sm text-secondary-900 mb-2">{t.title}</h1>
        <p className="text-body-md text-secondary-500">
          {language === "ko"
            ? "AI 모델과 제품을 선택하여 마케팅 영상을 생성하세요"
            : "Select AI model and product to generate marketing videos"}
        </p>
      </div>

      {/* Credit Info Banner */}
      <div
        className={`card p-4 mb-8 border-l-4 ${
          hasInsufficientCredits
            ? "border-l-error-500 bg-error-50"
            : "border-l-primary-500"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                hasInsufficientCredits ? "bg-error-100" : "bg-primary-100"
              }`}
            >
              <CreditIcon
                className={`w-5 h-5 ${
                  hasInsufficientCredits ? "text-error-600" : "text-primary-600"
                }`}
              />
            </div>
            <div>
              <p className="text-body-sm text-secondary-500">
                {language === "ko" ? "현재 크레딧" : "Current Credits"}
              </p>
              <p
                className={`text-heading-md ${
                  hasInsufficientCredits ? "text-error-600" : "text-secondary-900"
                }`}
              >
                {credits}{" "}
                <span className="text-body-sm text-secondary-400">
                  / {language === "ko" ? "20 필요" : "20 required"}
                </span>
              </p>
            </div>
          </div>
          {hasInsufficientCredits && (
            <Link
              href="/credits"
              className="btn-primary btn-sm"
            >
              {language === "ko" ? "크레딧 충전" : "Buy Credits"}
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card p-4 mb-8 bg-error-50 border border-error-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-error-100 flex items-center justify-center flex-shrink-0">
              <span className="text-error-600">!</span>
            </div>
            <p className="text-body-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Step 1: 영상 사이즈 선택 */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-sm">1</span>
            </div>
            <h2 className="text-heading-md text-secondary-900">{t.videoSize}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VIDEO_SIZES.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSelectedSize(size.id)}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  selectedSize === size.id
                    ? "border-primary-500 bg-primary-50 ring-4 ring-primary-100"
                    : "border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50"
                }`}
              >
                <div className="text-3xl mb-3">{size.icon}</div>
                <div className="text-heading-sm text-secondary-900 mb-1">
                  {t[size.id as keyof typeof t]}
                </div>
                <div className="text-body-sm text-secondary-500 mb-2">
                  {t[`${size.id}Subtitle` as keyof typeof t]}
                </div>
                <div className="text-caption text-secondary-400 font-mono">
                  {size.ratio} · {size.width}×{size.height}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: AI 모델 선택 */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-bold text-sm">2</span>
              </div>
              <h2 className="text-heading-md text-secondary-900">{t.model}</h2>
            </div>
            <Link
              href="/avatars/create"
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t.createNew}
            </Link>
          </div>

          {avatars.length === 0 ? (
            <div className="border-2 border-dashed border-secondary-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-100 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-body-md text-secondary-600 mb-4">{t.noModels}</p>
              <Link href="/avatars/create" className="btn-primary">
                {t.createModel}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`aspect-[3/4] rounded-2xl border-2 transition-all relative overflow-hidden group ${
                    selectedAvatar === avatar.id
                      ? "border-primary-500 ring-4 ring-primary-100"
                      : "border-secondary-200 hover:border-secondary-300"
                  }`}
                >
                  <div className="absolute inset-0 bg-secondary-100 flex items-center justify-center">
                    {avatar.preview_images?.[0] ? (
                      <img
                        src={avatar.preview_images[0]}
                        alt={avatar.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-secondary-300" />
                    )}
                  </div>
                  {selectedAvatar === avatar.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-body-sm text-white font-medium truncate">
                      {avatar.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 3: 제품 선택 */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-bold text-sm">3</span>
              </div>
              <h2 className="text-heading-md text-secondary-900">{t.product}</h2>
            </div>
            <Link
              href="/products/upload"
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t.uploadNew}
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="border-2 border-dashed border-secondary-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-100 flex items-center justify-center">
                <ShirtIcon className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-body-md text-secondary-600 mb-4">{t.noProducts}</p>
              <Link href="/products/upload" className="btn-primary">
                {t.uploadProduct}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProduct(product.id)}
                  className={`aspect-square rounded-2xl border-2 transition-all relative overflow-hidden group ${
                    selectedProduct === product.id
                      ? "border-primary-500 ring-4 ring-primary-100"
                      : "border-secondary-200 hover:border-secondary-300"
                  }`}
                >
                  <div className="absolute inset-0 bg-secondary-50 flex items-center justify-center p-3">
                    <img
                      src={product.processed_image_url || product.original_image_url}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  {selectedProduct === product.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 4: 배경 선택 */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-sm">4</span>
            </div>
            <h2 className="text-heading-md text-secondary-900">{t.background}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                  selectedBackground === bg.id
                    ? "border-primary-500 bg-primary-50 ring-4 ring-primary-100"
                    : "border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50"
                }`}
              >
                <div className="text-2xl mb-2">{bg.icon}</div>
                <div className="text-body-sm text-secondary-700 font-medium">
                  {t[bg.id as keyof typeof t]}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 5: 동작 선택 */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-sm">5</span>
            </div>
            <h2 className="text-heading-md text-secondary-900">{t.action}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedAction(action.id)}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                  selectedAction === action.id
                    ? "border-primary-500 bg-primary-50 ring-4 ring-primary-100"
                    : "border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50"
                }`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-body-sm text-secondary-700 font-medium">
                  {t[action.id as keyof typeof t]}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 생성 버튼 */}
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-body-sm">
              <div className="flex items-center gap-2">
                <span className="text-secondary-500">{t.size}:</span>
                <span className="font-mono text-secondary-900">{selectedSizeInfo?.ratio || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary-500">{t.duration}:</span>
                <span className="font-mono text-secondary-900">15s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary-500">{t.cost}:</span>
                <span className="font-mono text-primary-600 font-bold">20 credits</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !isFormValid || hasInsufficientCredits}
              className="btn-primary btn-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  {t.generating}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <VideoIcon className="w-5 h-5" />
                  {t.generateVideo}
                </span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 안내 정보 */}
      <div className="mt-8 card p-6 border-l-4 border-l-accent-500">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
            <InfoIcon className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <h4 className="text-heading-sm text-secondary-900 mb-2">
              {language === "ko" ? "영상 생성 안내" : "Video Generation Info"}
            </h4>
            <ul className="space-y-1.5 text-body-sm text-secondary-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                {language === "ko"
                  ? "영상 생성은 약 25-30분이 소요됩니다"
                  : "Video generation takes approximately 25-30 minutes"}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                {language === "ko"
                  ? "영상이 생성되는 동안 다른 작업을 계속할 수 있습니다"
                  : "You can continue working while videos are being generated"}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                {language === "ko"
                  ? "생성된 영상은 라이브러리에서 확인할 수 있습니다"
                  : "Generated videos can be found in the Library"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateVideoForm() {
  return (
    <LanguageProvider>
      <CreateVideoFormInner />
    </LanguageProvider>
  );
}

// Icons
function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12v7.5h4.5V12l1.64-1.64a6 6 0 001.676-3.257l.319-1.913-3.375 1.125a6 6 0 01-3.02 0L6.115 5.19z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
