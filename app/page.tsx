import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLanguage } from "@/lib/getLanguage";
import { HOME_TRANSLATIONS } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { LanguageProvider } from "@/components/LanguageProvider";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 이미 로그인한 사용자는 대시보드로 리다이렉트
  if (user) {
    redirect("/dashboard");
  }

  const language = await getLanguage();
  const t = HOME_TRANSLATIONS[language];

  return (
    <LanguageProvider initialLanguage={language}>
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-4xl px-6">
          {/* 언어 선택 */}
          <div className="mb-8">
            <LanguageSelector />
          </div>

          <h1 className="text-7xl font-bold text-black mb-6 tracking-tight whitespace-pre-line">
            {t.title}
          </h1>
          <p className="text-lg text-gray-600 mb-12 font-light">
            {t.subtitle1}
            <br />
            {t.subtitle2}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary">
              {t.startForFree}
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              {t.signIn}
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500 font-mono">
            {t.freeCredits}
          </p>
        </div>
      </div>
    </LanguageProvider>
  );
}
