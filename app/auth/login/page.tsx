"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AUTH_TRANSLATIONS } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { LanguageProvider } from "@/components/LanguageProvider";
import { useLanguage } from "@/components/LanguageProvider";

function LoginForm() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);

  const t = AUTH_TRANSLATIONS[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* 언어 선택 */}
        <div className="mb-8">
          <LanguageSelector />
        </div>

        <Link href="/" className="block text-center mb-12">
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        </Link>

        <div className="border border-gray-200 p-8">
          <h2 className="text-xs font-bold tracking-widest mb-8">{t.signIn}</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="border border-black bg-gray-50 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-2 tracking-wide">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium mb-2 tracking-wide">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder={t.passwordPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? t.signingIn : t.signInButton}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-600">{t.noAccount} </span>
            <Link href="/auth/signup" className="underline hover:no-underline">
              {t.createOne}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LanguageProvider>
      <LoginForm />
    </LanguageProvider>
  );
}
