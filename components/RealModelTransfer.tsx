"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

interface Avatar {
  id: string;
  name: string;
  preview_images?: string[];
}

interface Product {
  id: string;
  name: string;
  type: string;
  processed_image_url?: string;
  original_image_url: string;
}

const translations = {
  ko: {
    title: "Real Model Transfer",
    subtitle: "실제 모델 영상을 AI 캐릭터로 교체합니다",
    feature: "Runway Gen-4도 못하는 기능!",
    uploadVideo: "영상 업로드",
    dragDrop: "원본 영상을 드래그하거나 클릭",
    formats: "MP4, WebM (최대 100MB, 15초 권장)",
    selectAvatar: "AI 모델 선택",
    selectProducts: "제품 선택 (선택사항)",
    keepBackground: "원본 배경 유지",
    keepBackgroundDesc: "원본 영상의 배경과 조명을 유지합니다",
    cost: "비용: 30 크레딧",
    processingTime: "처리 시간: 약 10-20분",
    submit: "영상 변환 시작",
    submitting: "업로드 중...",
    success: "영상 변환이 시작되었습니다!",
    error: "오류가 발생했습니다",
    tips: [
      "720p 이상의 고화질 영상 권장",
      "너무 빠른 움직임은 품질 저하",
      "얼굴이 명확히 보이는 영상",
      "한 사람만 등장하는 영상",
    ],
    benefits: [
      "1회 촬영 → 무한대 캐릭터",
      "모델 비용 90% 절감",
      "다양성: 여러 인종/체형으로 변환",
      "A/B 테스트: 같은 영상, 다른 모델",
    ],
  },
  en: {
    title: "Real Model Transfer",
    subtitle: "Replace real model with AI character",
    feature: "A feature even Runway Gen-4 doesn&apos;t have!",
    uploadVideo: "Upload Video",
    dragDrop: "Drag & drop or click to upload",
    formats: "MP4, WebM (max 100MB, 15 sec recommended)",
    selectAvatar: "Select AI Model",
    selectProducts: "Select Products (optional)",
    keepBackground: "Keep Original Background",
    keepBackgroundDesc: "Preserve the original video background and lighting",
    cost: "Cost: 30 credits",
    processingTime: "Processing time: ~10-20 minutes",
    submit: "Start Video Transfer",
    submitting: "Uploading...",
    success: "Video transfer has started!",
    error: "An error occurred",
    tips: [
      "720p or higher quality recommended",
      "Fast movements may reduce quality",
      "Clear face visibility required",
      "Single person in frame",
    ],
    benefits: [
      "1 shoot → unlimited characters",
      "90% model cost savings",
      "Diversity: multiple ethnicities/body types",
      "A/B test: same video, different models",
    ],
  },
};

export default function RealModelTransfer() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [keepBackground, setKeepBackground] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const [avatarsRes, productsRes] = await Promise.all([
        fetch("/api/avatars"),
        fetch("/api/products"),
      ]);

      if (avatarsRes.ok) {
        const data = await avatarsRes.json();
        setAvatars(data.avatars?.filter((a: Avatar) => a.preview_images?.length) || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
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

    if (e.dataTransfer.files?.[0]?.type.startsWith("video/")) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : prev.length < 3
        ? [...prev, productId]
        : prev
    );
  };

  const handleSubmit = async () => {
    if (!videoFile || !selectedAvatar) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("avatarId", selectedAvatar);
      formData.append("productIds", selectedProducts.join(","));
      formData.append("keepBackground", keepBackground.toString());

      const response = await fetch("/api/video/transfer", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: t.success });
        setVideoFile(null);
        setVideoPreview(null);
        setSelectedAvatar(null);
        setSelectedProducts([]);
      } else {
        setResult({ success: false, message: data.error || t.error });
      }
    } catch {
      setResult({ success: false, message: t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-primary-500 to-accent-600 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚀</span>
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
            EXCLUSIVE
          </span>
        </div>
        <h2 className="text-heading-lg mb-2">{t.title}</h2>
        <p className="text-white/80 mb-4">{t.subtitle}</p>
        <p className="text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg inline-block">
          {t.feature}
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3">
        {t.benefits.map((benefit, i) => (
          <div key={i} className="flex items-center gap-2 p-3 bg-success-50 rounded-xl">
            <span className="text-success-600">✓</span>
            <span className="text-body-sm text-success-700">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Video Upload */}
      <div className="card p-6">
        <h3 className="text-heading-sm text-secondary-900 mb-4">{t.uploadVideo}</h3>

        {!videoPreview ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? "border-primary-500 bg-primary-50" : "border-secondary-200"
            }`}
          >
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <VideoIcon className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
            <p className="text-body-md text-secondary-600">{t.dragDrop}</p>
            <p className="text-caption text-secondary-400 mt-2">{t.formats}</p>
          </div>
        ) : (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            <video
              src={videoPreview}
              controls
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => {
                setVideoFile(null);
                setVideoPreview(null);
              }}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-lg text-white hover:bg-error-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Tips */}
        <ul className="mt-4 space-y-1 text-caption text-secondary-500">
          {t.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-500 mt-1.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Avatar Selection */}
      <div className="card p-6">
        <h3 className="text-heading-sm text-secondary-900 mb-4">{t.selectAvatar}</h3>
        <div className="grid grid-cols-4 gap-3">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={`aspect-square rounded-xl overflow-hidden transition-all ${
                selectedAvatar === avatar.id
                  ? "ring-2 ring-primary-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-secondary-300"
              }`}
            >
              <img
                src={avatar.preview_images?.[0]}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Product Selection (Optional) */}
      <div className="card p-6">
        <h3 className="text-heading-sm text-secondary-900 mb-4">{t.selectProducts}</h3>
        <div className="grid grid-cols-5 gap-3">
          {products.slice(0, 10).map((product) => (
            <button
              key={product.id}
              onClick={() => toggleProduct(product.id)}
              className={`aspect-square rounded-xl overflow-hidden transition-all ${
                selectedProducts.includes(product.id)
                  ? "ring-2 ring-primary-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-secondary-300"
              }`}
            >
              <img
                src={product.processed_image_url || product.original_image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="card p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-body-md font-medium text-secondary-900">{t.keepBackground}</p>
            <p className="text-caption text-secondary-500">{t.keepBackgroundDesc}</p>
          </div>
          <div
            className={`w-12 h-6 rounded-full transition-colors ${
              keepBackground ? "bg-primary-600" : "bg-secondary-200"
            }`}
            onClick={() => setKeepBackground(!keepBackground)}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                keepBackground ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>
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
          disabled={loading || !videoFile || !selectedAvatar}
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
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
