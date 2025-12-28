"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UPLOAD_PRODUCT_TRANSLATIONS, PRODUCTS_TRANSLATIONS } from "@/lib/i18n";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";

const PRODUCT_TYPES = [
  { id: "top", icon: "👕", gradient: "from-blue-500 to-indigo-500" },
  { id: "bottom", icon: "👖", gradient: "from-indigo-500 to-purple-500" },
  { id: "dress", icon: "👗", gradient: "from-pink-500 to-rose-500" },
  { id: "shoes", icon: "👞", gradient: "from-amber-500 to-orange-500" },
  { id: "accessories", icon: "👜", gradient: "from-emerald-500 to-teal-500" },
  { id: "beauty", icon: "💄", gradient: "from-rose-500 to-pink-500" },
];

function UploadProductForm() {
  const { language } = useLanguage();
  const t = UPLOAD_PRODUCT_TRANSLATIONS[language];
  const productT = PRODUCTS_TRANSLATIONS[language];
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [enhanceDetails, setEnhanceDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleImageChange = (file: File) => {
    // 파일 크기 확인 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t.errorFileTooLarge);
      return;
    }

    // 파일 타입 확인
    if (!file.type.startsWith("image/")) {
      setError(t.errorInvalidFileType);
      return;
    }

    setImageFile(file);
    setError("");

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t.errorNameRequired);
      return;
    }

    if (!productType) {
      setError(t.errorTypeRequired);
      return;
    }

    if (!imageFile) {
      setError(t.errorImageRequired);
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

      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      // Remove background using Replicate
      let processedImageUrl = publicUrl;

      try {
        const bgRemovalResponse = await fetch('/api/products/remove-bg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: publicUrl }),
        });

        if (bgRemovalResponse.ok) {
          const bgData = await bgRemovalResponse.json();
          processedImageUrl = bgData.processedImageUrl;
        } else {
          console.warn('Background removal failed, using original image');
        }
      } catch (bgError) {
        console.warn('Background removal error:', bgError);
      }

      // Create product in database
      const { data: product, error: insertError } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          name: name.trim(),
          type: productType,
          original_image_url: publicUrl,
          processed_image_url: processedImageUrl,
          metadata: {
            enhance_details: enhanceDetails,
            file_size: imageFile.size,
            file_type: imageFile.type,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.errorUploadFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass border-b border-secondary-200">
        <div className="container-default py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-secondary-200 transition-colors"
            >
              <ArrowLeftIcon />
            </Link>
            <div>
              <h1 className="text-heading-md text-secondary-900">{t.title}</h1>
              <p className="text-body-sm text-secondary-500">
                {language === "ko" ? "제품 이미지를 업로드하고 배경을 제거합니다" : "Upload product image and remove background"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container-default py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">

          {/* Error Message */}
          {error && (
            <div className="card p-4 border-error-500 bg-error-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                  <AlertIcon className="w-5 h-5 text-error-600" />
                </div>
                <p className="text-body-md text-error-600 flex-1">{error}</p>
              </div>
            </div>
          )}

          {/* 이미지 업로드 */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                1
              </div>
              <h2 className="text-heading-sm text-secondary-900">{t.productImage}</h2>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-primary-500 bg-primary-50"
                  : imagePreview
                  ? "border-secondary-200 bg-secondary-50"
                  : "border-secondary-300 hover:border-primary-400 hover:bg-secondary-50"
              }`}
            >
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-xl shadow-soft"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-error-500 text-white flex items-center justify-center hover:bg-error-600 transition-colors shadow-medium"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-secondary-400" />
                  </div>
                  <p className="text-body-md text-secondary-700 mb-2">
                    {t.clickToUpload}
                  </p>
                  <p className="text-body-sm text-secondary-500">
                    {t.fileFormat}
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageChange(file);
              }}
              className="hidden"
            />

            {/* 디테일 강화 옵션 */}
            <label className="mt-4 flex items-start gap-3 p-4 card-interactive cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={enhanceDetails}
                  onChange={(e) => setEnhanceDetails(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  enhanceDetails ? "bg-primary-600 border-primary-600" : "border-secondary-300"
                }`}>
                  {enhanceDetails && <CheckIcon className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div>
                <p className="text-body-md font-medium text-secondary-900">{t.enhanceDetails}</p>
                <p className="text-body-sm text-secondary-500">
                  {t.enhanceDetailsDesc}
                </p>
              </div>
            </label>
          </div>

          {/* 제품 이름 */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                2
              </div>
              <h2 className="text-heading-sm text-secondary-900">{t.productName}</h2>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.productNamePlaceholder}
              className="input"
              maxLength={100}
            />
          </div>

          {/* 제품 타입 */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                3
              </div>
              <h2 className="text-heading-sm text-secondary-900">{t.productType}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PRODUCT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setProductType(type.id)}
                  className={`group relative p-6 rounded-2xl transition-all duration-300 ${
                    productType === type.id
                      ? "ring-2 ring-primary-500 ring-offset-2 bg-primary-50"
                      : "bg-secondary-50 hover:bg-secondary-100"
                  }`}
                >
                  <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">
                    {type.icon}
                  </div>
                  <div className="text-body-md font-medium text-secondary-900">
                    {productT[type.id as keyof typeof productT]}
                  </div>
                  {productType === type.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/products" className="flex-1 btn-secondary text-center">
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim() || !productType || !imageFile}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  {t.uploading}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  {t.uploadProduct}
                </span>
              )}
            </button>
          </div>

          {/* 처리 안내 */}
          <div className="card p-6 bg-secondary-50">
            <h4 className="text-heading-sm text-secondary-900 mb-3">
              {language === "ko" ? "처리 과정" : "Processing Steps"}
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

export default function UploadProductPage() {
  return (
    <LanguageProvider>
      <UploadProductForm />
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

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
