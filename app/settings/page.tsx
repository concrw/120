import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLanguage } from "@/lib/getLanguage";
import LanguageSelector from "@/components/LanguageSelector";

export default async function SettingsPage() {
  const supabase = await createClient();
  const language = await getLanguage();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const t = {
    ko: {
      title: "설정",
      subtitle: "계정 및 언어 설정을 관리하세요",
      accountInfo: "계정 정보",
      email: "이메일",
      credits: "크레딧",
      memberSince: "가입일",
      languageSettings: "언어 설정",
      selectLanguage: "언어 선택",
      languageDescription: "인터페이스 언어를 선택하세요. 변경 사항은 즉시 적용됩니다.",
    },
    en: {
      title: "SETTINGS",
      subtitle: "Manage your account and language preferences",
      accountInfo: "ACCOUNT INFO",
      email: "Email",
      credits: "Credits",
      memberSince: "Member Since",
      languageSettings: "LANGUAGE SETTINGS",
      selectLanguage: "Select Language",
      languageDescription: "Choose your interface language. Changes apply immediately.",
    },
  };

  const translations = t[language as keyof typeof t] || t.en;

  return (
    <DashboardLayout currentPage="settings">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {translations.title}
          </h1>
          <p className="text-gray-600">{translations.subtitle}</p>
        </div>

        {/* 계정 정보 */}
        <section className="mb-12">
          <h2 className="text-xs font-bold tracking-widest text-gray-500 mb-4">
            {translations.accountInfo}
          </h2>
          <div className="border border-gray-300 bg-white">
            <dl className="divide-y divide-gray-200">
              <div className="px-6 py-4 flex justify-between items-center">
                <dt className="text-sm text-gray-600">{translations.email}</dt>
                <dd className="text-sm font-mono text-black">{user.email}</dd>
              </div>
              <div className="px-6 py-4 flex justify-between items-center">
                <dt className="text-sm text-gray-600">{translations.credits}</dt>
                <dd className="text-sm font-mono text-black">{profile?.credits || 0}</dd>
              </div>
              <div className="px-6 py-4 flex justify-between items-center">
                <dt className="text-sm text-gray-600">{translations.memberSince}</dt>
                <dd className="text-sm font-mono text-black">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 언어 설정 */}
        <section>
          <h2 className="text-xs font-bold tracking-widest text-gray-500 mb-4">
            {translations.languageSettings}
          </h2>
          <div className="border border-gray-300 bg-white p-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">
                {translations.selectLanguage}
              </h3>
              <p className="text-sm text-gray-600">
                {translations.languageDescription}
              </p>
            </div>
            <LanguageSelector />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
