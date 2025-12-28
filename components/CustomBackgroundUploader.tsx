"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "./LanguageProvider";

interface CustomBackground {
  id: string;
  name: string;
  type: "image" | "video";
  file_url: string;
}

interface CustomBackgroundUploaderProps {
  onSelect: (background: CustomBackground | null) => void;
  selectedId?: string;
}

const translations = {
  ko: {
    title: "커스텀 배경",
    uploadImage: "이미지 업로드",
    uploadVideo: "영상 업로드",
    dragDrop: "파일을 드래그하거나 클릭하여 업로드",
    imageFormats: "JPG, PNG, WebP (최대 10MB)",
    videoFormats: "MP4, WebM (최대 50MB, 15초)",
    uploading: "업로드 중...",
    myBackgrounds: "내 배경",
    noBackgrounds: "업로드된 배경이 없습니다",
    delete: "삭제",
    usePreset: "프리셋 사용",
  },
  en: {
    title: "Custom Background",
    uploadImage: "Upload Image",
    uploadVideo: "Upload Video",
    dragDrop: "Drag & drop or click to upload",
    imageFormats: "JPG, PNG, WebP (max 10MB)",
    videoFormats: "MP4, WebM (max 50MB, 15 sec)",
    uploading: "Uploading...",
    myBackgrounds: "My Backgrounds",
    noBackgrounds: "No uploaded backgrounds",
    delete: "Delete",
    usePreset: "Use Preset",
  },
};

export default function CustomBackgroundUploader({
  onSelect,
  selectedId,
}: CustomBackgroundUploaderProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [backgrounds, setBackgrounds] = useState<CustomBackground[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [dragActive, setDragActive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadBackgrounds = useCallback(async () => {
    if (loaded) return;
    try {
      const response = await fetch("/api/backgrounds/upload");
      if (response.ok) {
        const data = await response.json();
        setBackgrounds(data.backgrounds || []);
        setLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load backgrounds:", error);
    }
  }, [loaded]);

  // Load backgrounds on mount
  useState(() => {
    loadBackgrounds();
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("type", uploadType);

      const response = await fetch("/api/backgrounds/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBackgrounds((prev) => [data.background, ...prev]);
        onSelect(data.background);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/backgrounds/upload?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBackgrounds((prev) => prev.filter((bg) => bg.id !== id));
        if (selectedId === id) {
          onSelect(null);
        }
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-heading-sm text-secondary-900">{t.title}</h4>

      {/* Upload Type Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setUploadType("image")}
          className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
            uploadType === "image"
              ? "bg-primary-100 text-primary-700"
              : "bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
          }`}
        >
          {t.uploadImage}
        </button>
        <button
          onClick={() => setUploadType("video")}
          className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
            uploadType === "video"
              ? "bg-primary-100 text-primary-700"
              : "bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
          }`}
        >
          {t.uploadVideo}
        </button>
      </div>

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
        }`}
      >
        <input
          type="file"
          accept={uploadType === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-secondary-100 flex items-center justify-center">
            {uploading ? (
              <LoadingSpinner className="w-6 h-6 text-primary-600" />
            ) : (
              <UploadIcon className="w-6 h-6 text-secondary-400" />
            )}
          </div>
          <p className="text-body-sm text-secondary-600">
            {uploading ? t.uploading : t.dragDrop}
          </p>
          <p className="text-caption text-secondary-400">
            {uploadType === "video" ? t.videoFormats : t.imageFormats}
          </p>
        </div>
      </div>

      {/* Backgrounds Grid */}
      {backgrounds.length > 0 && (
        <div>
          <p className="text-body-sm font-medium text-secondary-700 mb-3">{t.myBackgrounds}</p>
          <div className="grid grid-cols-3 gap-3">
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                className={`relative group aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedId === bg.id
                    ? "border-primary-500 ring-2 ring-primary-200"
                    : "border-transparent hover:border-secondary-200"
                }`}
                onClick={() => onSelect(bg)}
              >
                {bg.type === "video" ? (
                  <video
                    src={bg.file_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <img src={bg.file_url} alt={bg.name} className="w-full h-full object-cover" />
                )}

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bg.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-error-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Type Badge */}
                {bg.type === "video" && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-white text-xs">
                    VIDEO
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Selection */}
      {selectedId && (
        <button
          onClick={() => onSelect(null)}
          className="text-body-sm text-secondary-500 hover:text-secondary-700"
        >
          {t.usePreset}
        </button>
      )}
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
