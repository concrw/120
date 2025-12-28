import DashboardLayout from "@/components/DashboardLayout";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getLanguage } from "@/lib/getLanguage";
import { PRODUCTS_TRANSLATIONS } from "@/lib/i18n";

export default async function ProductsPage() {
  const supabase = await createClient();
  const language = await getLanguage();
  const t = PRODUCTS_TRANSLATIONS[language];

  const PRODUCT_TYPE_LABELS: Record<string, string> = {
    top: t.top,
    bottom: t.bottom,
    dress: t.dress,
    shoes: t.shoes,
    accessories: t.accessories,
    beauty: t.beauty,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 사용자의 제품 목록 가져오기
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout currentPage="products">
      <div className="animate-fade-in">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display-sm text-secondary-900 mb-2">
              {t.title}
            </h1>
            <p className="text-body-md text-secondary-500">
              {t.subtitle}
            </p>
          </div>
          <Link href="/products/upload" className="btn-primary inline-flex items-center gap-2">
            <UploadIcon />
            {t.uploadProduct}
          </Link>
        </div>

        {/* 제품 목록 */}
        {!products || products.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary-100 flex items-center justify-center">
              <ShirtIcon className="w-10 h-10 text-secondary-400" />
            </div>
            <h3 className="text-heading-md text-secondary-900 mb-2">{t.noProducts}</h3>
            <p className="text-body-md text-secondary-500 mb-6 max-w-md mx-auto">
              {language === "ko"
                ? "제품 이미지를 업로드하고 배경을 자동으로 제거하세요"
                : "Upload product images and automatically remove backgrounds"}
            </p>
            <Link href="/products/upload" className="btn-primary inline-flex items-center gap-2">
              <UploadIcon />
              {t.uploadProductButton}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                typeLabel={PRODUCT_TYPE_LABELS[product.type] || product.type}
                useText={t.use}
                infoText={t.info}
                deleteText={language === "ko" ? "삭제" : "Delete"}
                confirmDeleteText={language === "ko" ? "삭제 확인" : "Confirm Delete"}
              />
            ))}
          </div>
        )}

        {/* 제품 업로드 안내 */}
        <div className="mt-12 card p-6 border-l-4 border-l-accent-500">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
              <LightbulbIcon className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h4 className="text-heading-sm text-secondary-900 mb-2">
                {t.uploadTips}
              </h4>
              <ul className="space-y-1.5 text-body-sm text-secondary-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                  {t.tip1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                  {t.tip2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                  {t.tip3}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icons
function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}
