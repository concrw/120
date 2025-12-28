"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AvatarImageSelectorProps {
  avatarId: string;
  images: string[];
  selectedImage: string;
  language: string;
}

export default function AvatarImageSelector({
  avatarId,
  images,
  selectedImage: initialSelected,
  language,
}: AvatarImageSelectorProps) {
  const [selected, setSelected] = useState(initialSelected);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSelect = async (imageUrl: string) => {
    if (saving) return;

    setSelected(imageUrl);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("avatars")
        .update({ image_urls: [imageUrl] })
        .eq("id", avatarId);

      if (error) throw error;

      router.refresh();
    } catch (err) {
      console.error("Failed to update selected image:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xs font-bold tracking-widest mb-2">
          {language === "ko" ? "대표 이미지 선택" : "SELECT PRIMARY IMAGE"}
        </h3>
        <p className="text-sm text-gray-600">
          {language === "ko"
            ? "영상 제작에 사용될 이미지를 선택하세요"
            : "Choose the image to use for video generation"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {images.map((imageUrl, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(imageUrl)}
            disabled={saving}
            className={`relative aspect-[3/4] overflow-hidden border-2 transition-all ${
              selected === imageUrl
                ? "border-black"
                : "border-gray-200 hover:border-gray-400"
            } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <img
              src={imageUrl}
              alt={`Option ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {selected === imageUrl && (
              <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                <div className="bg-white px-3 py-1 text-xs font-medium tracking-wide">
                  {language === "ko" ? "선택됨" : "SELECTED"}
                </div>
              </div>
            )}

            <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 text-xs font-mono">
              #{index + 1}
            </div>
          </button>
        ))}
      </div>

      {saving && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          {language === "ko" ? "저장 중..." : "Saving..."}
        </div>
      )}
    </div>
  );
}
