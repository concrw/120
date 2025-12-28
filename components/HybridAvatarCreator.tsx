"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

interface BodyPartReference {
  part: "face" | "body" | "legs" | "skin_tone";
  imageUrl: string;
  weight: number;
  preview?: string;
}

const translations = {
  ko: {
    title: "부위별 레퍼런스 조합",
    subtitle: "여러 사람의 특징을 조합하여 이상적인 AI 모델을 만드세요",
    example: '"지젤의 다리 + 케이트 모스의 체형"',
    nameLabel: "모델 이름",
    namePlaceholder: "예: 브랜드 이상형 모델",
    bodyParts: {
      face: "얼굴형",
      body: "체형",
      legs: "다리",
      skin_tone: "피부톤",
    },
    required: "(필수)",
    optional: "(선택)",
    uploadImage: "이미지 업로드",
    weight: "가중치",
    addPart: "부위 추가",
    cost: "비용: 25 크레딧",
    processingTime: "처리 시간: 약 20-30분",
    submit: "하이브리드 모델 생성",
    submitting: "생성 중...",
    success: "하이브리드 모델 생성이 시작되었습니다!",
    error: "오류가 발생했습니다",
    minRefs: "얼굴과 체형 레퍼런스는 필수입니다",
    tips: [
      "각 부위는 512x512 이상의 이미지 필요",
      "너무 상반된 특징 조합 시 부자연스러움",
      "가중치로 각 부위의 영향도 조절",
      "최대 5개 레퍼런스 사용 가능",
    ],
  },
  en: {
    title: "Body Part Reference Mixing",
    subtitle: "Combine features from multiple people for your ideal AI model",
    example: '"Gisele\'s legs + Kate Moss\' body"',
    nameLabel: "Model Name",
    namePlaceholder: "e.g., Brand Ideal Model",
    bodyParts: {
      face: "Face Shape",
      body: "Body Type",
      legs: "Legs",
      skin_tone: "Skin Tone",
    },
    required: "(required)",
    optional: "(optional)",
    uploadImage: "Upload Image",
    weight: "Weight",
    addPart: "Add Part",
    cost: "Cost: 25 credits",
    processingTime: "Processing time: ~20-30 minutes",
    submit: "Create Hybrid Model",
    submitting: "Creating...",
    success: "Hybrid model creation has started!",
    error: "An error occurred",
    minRefs: "Face and body references are required",
    tips: [
      "Each part needs 512x512+ resolution",
      "Conflicting features may look unnatural",
      "Adjust weights to control influence",
      "Maximum 5 references allowed",
    ],
  },
};

const BODY_PARTS: Array<{
  id: "face" | "body" | "legs" | "skin_tone";
  required: boolean;
}> = [
  { id: "face", required: true },
  { id: "body", required: true },
  { id: "legs", required: false },
  { id: "skin_tone", required: false },
];

export default function HybridAvatarCreator() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [name, setName] = useState("");
  const [references, setReferences] = useState<BodyPartReference[]>([
    { part: "face", imageUrl: "", weight: 70, preview: undefined },
    { part: "body", imageUrl: "", weight: 100, preview: undefined },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleImageUpload = async (part: string, file: File) => {
    setUploading(part);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("part", part);

      const response = await fetch("/api/avatars/hybrid", {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setReferences((prev) =>
          prev.map((ref) =>
            ref.part === part
              ? { ...ref, imageUrl: data.imageUrl, preview: URL.createObjectURL(file) }
              : ref
          )
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(null);
    }
  };

  const updateWeight = (part: string, weight: number) => {
    setReferences((prev) =>
      prev.map((ref) => (ref.part === part ? { ...ref, weight } : ref))
    );
  };

  const addPart = (partId: "legs" | "skin_tone") => {
    if (references.some((r) => r.part === partId)) return;
    setReferences((prev) => [
      ...prev,
      { part: partId, imageUrl: "", weight: 50, preview: undefined },
    ]);
  };

  const removePart = (part: string) => {
    const partInfo = BODY_PARTS.find((p) => p.id === part);
    if (partInfo?.required) return;
    setReferences((prev) => prev.filter((r) => r.part !== part));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const faceRef = references.find((r) => r.part === "face" && r.imageUrl);
    const bodyRef = references.find((r) => r.part === "body" && r.imageUrl);

    if (!faceRef || !bodyRef) {
      setResult({ success: false, message: t.minRefs });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/avatars/hybrid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          references: references
            .filter((r) => r.imageUrl)
            .map((r) => ({
              part: r.part,
              imageUrl: r.imageUrl,
              weight: r.weight,
            })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: t.success });
        setName("");
        setReferences([
          { part: "face", imageUrl: "", weight: 70, preview: undefined },
          { part: "body", imageUrl: "", weight: 100, preview: undefined },
        ]);
      } else {
        setResult({ success: false, message: data.error || t.error });
      }
    } catch {
      setResult({ success: false, message: t.error });
    } finally {
      setLoading(false);
    }
  };

  const optionalParts = BODY_PARTS.filter(
    (p) => !p.required && !references.some((r) => r.part === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-accent-500 to-primary-600 text-white">
        <h2 className="text-heading-lg mb-2">{t.title}</h2>
        <p className="text-white/80 mb-3">{t.subtitle}</p>
        <p className="text-sm italic bg-white/10 px-3 py-1.5 rounded-lg inline-block">
          {t.example}
        </p>
      </div>

      {/* Name Input */}
      <div className="card p-6">
        <label className="text-body-sm font-medium text-secondary-700 mb-2 block">
          {t.nameLabel}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="w-full px-4 py-3 rounded-xl border border-secondary-200 bg-white text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Body Parts */}
      <div className="space-y-4">
        {references.map((ref) => {
          const partInfo = BODY_PARTS.find((p) => p.id === ref.part);
          return (
            <div key={ref.part} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-heading-sm text-secondary-900">
                    {t.bodyParts[ref.part]}
                  </h4>
                  <span
                    className={`text-caption ${
                      partInfo?.required ? "text-error-500" : "text-secondary-400"
                    }`}
                  >
                    {partInfo?.required ? t.required : t.optional}
                  </span>
                </div>
                {!partInfo?.required && (
                  <button
                    onClick={() => removePart(ref.part)}
                    className="p-1 text-secondary-400 hover:text-error-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                {/* Image Upload */}
                <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-secondary-100 flex-shrink-0">
                  {ref.preview ? (
                    <img src={ref.preview} alt={ref.part} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {uploading === ref.part ? (
                        <LoadingSpinner className="w-8 h-8 text-primary-600" />
                      ) : (
                        <svg className="w-10 h-10 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(ref.part, e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading !== null}
                  />
                </div>

                {/* Weight Slider */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body-sm text-secondary-600">{t.weight}</span>
                    <span className="text-body-sm font-mono font-bold text-primary-600">
                      {ref.weight}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ref.weight}
                    onChange={(e) => updateWeight(ref.part, parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-caption text-secondary-400 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Optional Parts */}
      {optionalParts.length > 0 && (
        <div className="flex gap-2">
          {optionalParts.map((part) => (
            <button
              key={part.id}
              onClick={() => addPart(part.id as "legs" | "skin_tone")}
              className="px-4 py-2 rounded-lg border-2 border-dashed border-secondary-200 text-secondary-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
            >
              + {t.bodyParts[part.id]}
            </button>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="card p-4 bg-secondary-50">
        <ul className="space-y-1 text-caption text-secondary-600">
          {t.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Cost & Submit */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-body-md font-medium text-secondary-900">{t.cost}</p>
            <p className="text-caption text-secondary-500">{t.processingTime}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <CreditIcon className="w-6 h-6 text-primary-600" />
          </div>
        </div>

        {result && (
          <div
            className={`mb-4 p-4 rounded-xl ${
              result.success
                ? "bg-success-50 text-success-700"
                : "bg-error-50 text-error-700"
            }`}
          >
            {result.message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
