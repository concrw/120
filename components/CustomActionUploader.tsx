"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

interface CustomAction {
  id: string;
  name: string;
  video_url: string;
  status: string;
}

interface CustomActionUploaderProps {
  onSelect: (action: CustomAction | null) => void;
  selectedId?: string;
}

const translations = {
  ko: {
    title: "커스텀 동작",
    subtitle: "레퍼런스 영상을 업로드하여 동작을 추출합니다",
    uploadTitle: "영상 업로드",
    dragDrop: "영상 파일을 드래그하거나 클릭",
    formats: "MP4, WebM (최대 100MB, 15초 권장)",
    nameLabel: "동작 이름",
    namePlaceholder: "예: 런웨이 워킹",
    uploading: "업로드 중...",
    processing: "동작 추출 중...",
    myActions: "내 동작",
    noActions: "업로드된 동작이 없습니다",
    usePreset: "프리셋 동작 사용",
    delete: "삭제",
    tips: [
      "부드러운 움직임의 영상이 좋습니다",
      "배경이 단순한 영상 권장",
      "15초 이하의 짧은 영상 권장",
      "한 사람만 등장하는 영상",
    ],
  },
  en: {
    title: "Custom Action",
    subtitle: "Upload a reference video to extract motion",
    uploadTitle: "Upload Video",
    dragDrop: "Drag & drop or click to upload",
    formats: "MP4, WebM (max 100MB, 15 sec recommended)",
    nameLabel: "Action Name",
    namePlaceholder: "e.g., Runway Walk",
    uploading: "Uploading...",
    processing: "Extracting motion...",
    myActions: "My Actions",
    noActions: "No uploaded actions",
    usePreset: "Use Preset Action",
    delete: "Delete",
    tips: [
      "Smooth movements work best",
      "Simple backgrounds recommended",
      "Short videos (under 15 sec)",
      "Single person in frame",
    ],
  },
};

export default function CustomActionUploader({
  onSelect,
  selectedId,
}: CustomActionUploaderProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [actions, setActions] = useState<CustomAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [actionName, setActionName] = useState("");

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/actions/custom");
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error("Failed to load actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("name", actionName || file.name.replace(/\.[^/.]+$/, ""));

      const response = await fetch("/api/actions/custom", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setActions((prev) => [data.action, ...prev]);
        onSelect(data.action);
        setActionName("");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/actions/custom?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setActions((prev) => prev.filter((a) => a.id !== id));
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
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        handleUpload(file);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-heading-sm text-secondary-900">{t.title}</h4>
        <p className="text-caption text-secondary-500">{t.subtitle}</p>
      </div>

      {/* Tips */}
      <ul className="text-caption text-secondary-500 space-y-1">
        {t.tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5" />
            {tip}
          </li>
        ))}
      </ul>

      {/* Name Input */}
      <div>
        <label className="text-body-sm font-medium text-secondary-700 mb-2 block">
          {t.nameLabel}
        </label>
        <input
          type="text"
          value={actionName}
          onChange={(e) => setActionName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 bg-white text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
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
          accept="video/mp4,video/webm"
          onChange={(e) => {
            if (e.target.files?.[0]) handleUpload(e.target.files[0]);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-secondary-100 flex items-center justify-center">
            {uploading ? (
              <LoadingSpinner className="w-6 h-6 text-primary-600" />
            ) : (
              <VideoIcon className="w-6 h-6 text-secondary-400" />
            )}
          </div>
          <p className="text-body-sm text-secondary-600">
            {uploading ? t.uploading : t.dragDrop}
          </p>
          <p className="text-caption text-secondary-400">{t.formats}</p>
        </div>
      </div>

      {/* Actions List */}
      {actions.length > 0 && (
        <div>
          <p className="text-body-sm font-medium text-secondary-700 mb-3">{t.myActions}</p>
          <div className="space-y-2">
            {actions.map((action) => (
              <div
                key={action.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedId === action.id
                    ? "bg-primary-50 ring-2 ring-primary-500"
                    : "bg-secondary-50 hover:bg-secondary-100"
                }`}
                onClick={() => onSelect(action)}
              >
                <div className="w-16 aspect-video rounded-lg overflow-hidden bg-secondary-200 flex-shrink-0">
                  <video
                    src={action.video_url}
                    className="w-full h-full object-cover"
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-secondary-900 truncate">
                    {action.name}
                  </p>
                  <span
                    className={`text-caption ${
                      action.status === "ready"
                        ? "text-success-600"
                        : "text-warning-600"
                    }`}
                  >
                    {action.status === "ready" ? "Ready" : t.processing}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(action.id);
                  }}
                  className="p-2 text-secondary-400 hover:text-error-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
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

      {loading && (
        <div className="text-center py-4">
          <LoadingSpinner className="w-6 h-6 text-primary-600 mx-auto" />
        </div>
      )}
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
