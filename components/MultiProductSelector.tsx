"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

interface Product {
  id: string;
  name: string;
  type: string;
  original_image_url: string;
  processed_image_url?: string;
}

interface MultiProductSelectorProps {
  onSelect: (products: Product[]) => void;
  selectedProducts: Product[];
  maxProducts?: number;
}

const translations = {
  ko: {
    title: "제품 선택",
    subtitle: (max: number) => `최대 ${max}개의 제품을 선택할 수 있습니다`,
    selected: (count: number, max: number) => `${count}/${max} 선택됨`,
    noProducts: "등록된 제품이 없습니다",
    uploadFirst: "제품을 먼저 업로드해주세요",
    types: {
      top: "상의",
      bottom: "하의",
      dress: "원피스",
      shoes: "신발",
      accessory: "악세서리",
      beauty: "뷰티",
    },
    remove: "제거",
    limitReached: "최대 선택 수에 도달했습니다",
  },
  en: {
    title: "Select Products",
    subtitle: (max: number) => `You can select up to ${max} products`,
    selected: (count: number, max: number) => `${count}/${max} selected`,
    noProducts: "No products registered",
    uploadFirst: "Please upload products first",
    types: {
      top: "Top",
      bottom: "Bottom",
      dress: "Dress",
      shoes: "Shoes",
      accessory: "Accessory",
      beauty: "Beauty",
    },
    remove: "Remove",
    limitReached: "Maximum selection reached",
  },
};

export default function MultiProductSelector({
  onSelect,
  selectedProducts,
  maxProducts = 3,
}: MultiProductSelectorProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (product: Product) => {
    const isSelected = selectedProducts.some((p) => p.id === product.id);

    if (isSelected) {
      onSelect(selectedProducts.filter((p) => p.id !== product.id));
    } else if (selectedProducts.length < maxProducts) {
      onSelect([...selectedProducts, product]);
    }
  };

  const filteredProducts = filterType
    ? products.filter((p) => p.type === filterType)
    : products;

  const productTypes = [...new Set(products.map((p) => p.type))];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-secondary-100 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-secondary-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-heading-sm text-secondary-900">{t.title}</h4>
          <p className="text-caption text-secondary-500">{t.subtitle(maxProducts)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-body-sm font-medium ${
            selectedProducts.length === maxProducts
              ? "bg-warning-100 text-warning-700"
              : "bg-primary-100 text-primary-700"
          }`}
        >
          {t.selected(selectedProducts.length, maxProducts)}
        </span>
      </div>

      {/* Selected Products Preview */}
      {selectedProducts.length > 0 && (
        <div className="flex gap-3 p-4 bg-secondary-50 rounded-xl">
          {selectedProducts.map((product, index) => (
            <div key={product.id} className="relative group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary-500">
                <img
                  src={product.processed_image_url || product.original_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -top-2 -left-2 w-6 h-6 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <button
                onClick={() => toggleProduct(product)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Type Filter */}
      {productTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
              filterType === null
                ? "bg-primary-100 text-primary-700"
                : "bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
            }`}
          >
            All
          </button>
          {productTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
                filterType === type
                  ? "bg-primary-100 text-primary-700"
                  : "bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
              }`}
            >
              {t.types[type as keyof typeof t.types] || type}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-secondary-50 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-100 flex items-center justify-center">
            <ProductIcon className="w-8 h-8 text-secondary-400" />
          </div>
          <p className="text-body-sm text-secondary-600">{t.noProducts}</p>
          <p className="text-caption text-secondary-400 mt-1">{t.uploadFirst}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredProducts.map((product) => {
            const isSelected = selectedProducts.some((p) => p.id === product.id);
            const canSelect = selectedProducts.length < maxProducts || isSelected;

            return (
              <button
                key={product.id}
                onClick={() => toggleProduct(product)}
                disabled={!canSelect}
                className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                  isSelected
                    ? "ring-2 ring-primary-500 ring-offset-2"
                    : canSelect
                    ? "hover:ring-2 hover:ring-secondary-300 hover:ring-offset-2"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <img
                  src={product.processed_image_url || product.original_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedProducts.findIndex((p) => p.id === product.id) + 1}
                    </div>
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="px-2 py-0.5 bg-black/60 rounded text-white text-xs truncate block">
                    {t.types[product.type as keyof typeof t.types] || product.type}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Limit Warning */}
      {selectedProducts.length === maxProducts && (
        <p className="text-caption text-warning-600 text-center">{t.limitReached}</p>
      )}
    </div>
  );
}

function ProductIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}
