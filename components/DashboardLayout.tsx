import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLanguage } from "@/lib/getLanguage";
import { LAYOUT_TRANSLATIONS } from "@/lib/i18n";
import MobileNav from "./MobileNav";

export default async function DashboardLayout({
  children,
  currentPage,
}: {
  children: React.ReactNode;
  currentPage?: string;
}) {
  const supabase = await createClient();
  const language = await getLanguage();
  const t = LAYOUT_TRANSLATIONS[language];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 사용자 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits || 0;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* 헤더 */}
      <header className="border-b border-secondary-200 sticky top-0 z-30 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <Link href="/dashboard" className="flex-shrink-0">
              <h1 className="text-lg font-bold tracking-tight text-secondary-900 hover:text-primary-600 transition-colors">
                {t.appTitle}
              </h1>
            </Link>

            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "dashboard"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                {t.dashboard}
              </Link>
              <Link
                href="/create"
                className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "create"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                {t.create}
              </Link>
              <Link
                href="/avatars"
                className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "avatars"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                {t.models}
              </Link>
              <Link
                href="/products"
                className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "products"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                {t.products}
              </Link>
              <Link
                href="/library"
                className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "library"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                {t.library}
              </Link>
              <Link
                href="/transfer"
                className={`px-4 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "transfer"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                Transfer
              </Link>
            </nav>

            {/* 우측 메뉴 */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* 크레딧 - 데스크톱 */}
              <Link
                href="/credits"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <CreditIcon className="w-4 h-4 text-primary-600" />
                <span className="text-body-sm font-mono font-medium text-primary-700">{credits}</span>
              </Link>

              {/* 설정 - 데스크톱 */}
              <Link
                href="/settings"
                className={`hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-body-sm transition-colors ${
                  currentPage === "settings"
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden lg:inline">{t.settings}</span>
              </Link>

              {/* 로그아웃 - 데스크톱 */}
              <form action="/auth/signout" method="post" className="hidden md:block">
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg text-body-sm text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  {t.logout}
                </button>
              </form>

              {/* 모바일 네비게이션 */}
              <MobileNav currentPage={currentPage} credits={credits} t={t} />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}

// Icons
function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
