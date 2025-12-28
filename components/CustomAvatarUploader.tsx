"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "./LanguageProvider";

interface CustomAvatarUploaderProps {
  onSuccess?: (avatarId: string) => void;
}

const translations = {
  ko: {
    title: "커스텀 AI 모델 만들기",
    subtitle: "10-20장의 사진을 업로드하여 나만의 AI 모델을 생성하세요",
    nameLabel: "모델 이름",
    namePlaceholder: "예: 브랜드 모델 A",
    photosLabel: "사진 업로드",
    photosHint: "10-20장의 다양한 각도의 사진이 필요합니다",
    requirements: [
      "정면, 측면, 다양한 표정 포함",
      "선명한 얼굴 사진",
      "다양한 조명 환경",
      "배경이 단순한 사진 권장",
    ],
    photoCount: (count: number) => `${count}/20 장 선택됨`,
    costLabel: "비용: 20 크레딧",
    trainingTime: "학습 시간: 약 15-30분",
    submit: "AI 모델 생성 시작",
    submitting: "업로드 중...",
    success: "AI 모델 학습이 시작되었습니다!",
    error: "오류가 발생했습니다. 다시 시도해주세요.",
    insufficientCredits: "크레딧이 부족합니다. 20 크레딧이 필요합니다.",
    minPhotos: "최소 10장의 사진을 업로드해주세요",
    dragDrop: "파일을 드래그하거나 클릭하여 업로드",
    formats: "JPG, PNG, WebP (각 최대 10MB)",
    removeAll: "모두 제거",
  },
  en: {
    title: "Create Custom AI Model",
    subtitle: "Upload 10-20 photos to create your own AI model",
    nameLabel: "Model Name",
    namePlaceholder: "e.g., Brand Model A",
    photosLabel: "Upload Photos",
    photosHint: "10-20 photos from various angles required",
    requirements: [
      "Include front, side views, various expressions",
      "Clear facial photos",
      "Various lighting conditions",
      "Simple backgrounds recommended",
    ],
    photoCount: (count: number) => `${count}/20 photos selected`,
    costLabel: "Cost: 20 credits",
    trainingTime: "Training time: ~15-30 minutes",
    submit: "Start AI Model Training",
    submitting: "Uploading...",
    success: "AI model training has started!",
    error: "An error occurred. Please try again.",
    insufficientCredits: "Insufficient credits. 20 credits required.",
    minPhotos: "Please upload at least 10 photos",
    dragDrop: "Drag & drop or click to upload",
    formats: "JPG, PNG, WebP (max 10MB each)",
    removeAll: "Remove All",
  },
};

export default function CustomAvatarUploader({ onSuccess }: CustomAvatarUploaderProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    const remainingSlots = 20 - photos.length;
    const filesToAdd = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToAdd; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    setPhotos((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [photos.length]);

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos([]);
    setPreviews([]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (photos.length < 10) {
      setResult({ success: false, message: t.minPhotos });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const response = await fetch("/api/avatars/custom", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: t.success });
        clearAll();
        setName("");
        onSuccess?.(data.avatar.id);
      } else {
        setResult({
          success: false,
          message: data.error || t.error,
        });
      }
    } catch {
      setResult({ success: false, message: t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-heading-md text-secondary-900">{t.title}</h3>
        <p className="text-body-sm text-secondary-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Name Input */}
      <div>
        <label className="text-body-sm font-medium text-secondary-700 mb-2 block">
          {t.nameLabel}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="w-full px-4 py-3 rounded-xl border border-secondary-200 bg-white text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Photo Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-body-sm font-medium text-secondary-700">
            {t.photosLabel}
          </label>
          <span className="text-body-sm text-secondary-500">{t.photoCount(photos.length)}</span>
        </div>

        {/* Requirements */}
        <ul className="text-caption text-secondary-500 mb-4 space-y-1">
          {t.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5" />
              {req}
            </li>
          ))}
        </ul>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragActive
              ? "border-primary-500 bg-primary-50"
              : "border-secondary-200 hover:border-secondary-300"
          } ${photos.length >= 20 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={photos.length >= 20}
          />
          <UploadIcon className="w-10 h-10 mx-auto text-secondary-400 mb-3" />
          <p className="text-body-sm text-secondary-600">{t.dragDrop}</p>
          <p className="text-caption text-secondary-400 mt-1">{t.formats}</p>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-body-sm font-medium text-secondary-700">
                {t.photoCount(photos.length)}
              </span>
              <button
                onClick={clearAll}
                className="text-body-sm text-error-600 hover:text-error-700"
              >
                {t.removeAll}
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-error-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cost Info */}
      <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
        <div>
          <p className="text-body-sm font-medium text-secondary-900">{t.costLabel}</p>
          <p className="text-caption text-secondary-500">{t.trainingTime}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <CreditIcon className="w-5 h-5 text-primary-600" />
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`p-4 rounded-xl ${
            result.success
              ? "bg-success-50 text-success-700 border border-success-200"
              : "bg-error-50 text-error-700 border border-error-200"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !name.trim() || photos.length < 10}
        className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t.submitting : t.submit}
      </button>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
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
