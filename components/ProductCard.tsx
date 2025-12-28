"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductCardProps {
  product: any;
  typeLabel: string;
  useText: string;
  infoText: string;
  deleteText: string;
  confirmDeleteText: string;
}

export default function ProductCard({
  product,
  typeLabel,
  useText,
  infoText,
  deleteText,
  confirmDeleteText,
}: ProductCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setDeleting(true);

    try {
      // Delete product from database
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      // Optionally delete from storage
      if (product.original_image_url) {
        try {
          const url = new URL(product.original_image_url);
          const path = url.pathname.split("/").slice(-2).join("/");
          await supabase.storage.from("products").remove([path]);
        } catch (storageError) {
          console.warn("Failed to delete image from storage:", storageError);
        }
      }

      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="border border-gray-200 hover:border-black transition-colors">
      {/* 제품 이미지 */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
        {product.processed_image_url || product.original_image_url ? (
          <img
            src={product.processed_image_url || product.original_image_url}
            alt={product.name}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <span className="text-4xl text-gray-300">📦</span>
        )}

        {/* 타입 배지 */}
        <div className="absolute top-2 right-2">
          <span className="bg-white border border-gray-200 px-2 py-1 text-xs font-medium tracking-wide">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* 제품 정보 */}
      <div className="p-3 border-t border-gray-200">
        <h3 className="font-medium text-sm mb-2 truncate">{product.name}</h3>

        {/* 액션 버튼 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Link
              href={`/create?product=${product.id}`}
              className="flex-1 btn-primary text-center text-xs"
            >
              {useText}
            </Link>
            <Link
              href={`/products/${product.id}`}
              className="flex-1 btn-secondary text-center text-xs"
            >
              {infoText}
            </Link>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`w-full text-xs py-2 border transition-colors ${
              showConfirm
                ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            } disabled:opacity-50`}
          >
            {deleting
              ? "..."
              : showConfirm
                ? confirmDeleteText
                : deleteText}
          </button>
        </div>
      </div>
    </div>
  );
}
