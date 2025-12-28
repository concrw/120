"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AUTH_TRANSLATIONS } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { LanguageProvider } from "@/components/LanguageProvider";
import { useLanguage } from "@/components/LanguageProvider";

function SignupForm() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const t = AUTH_TRANSLATIONS[language];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordTooShort);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccess(true);

      if (data.user) {
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || t.signupFailed);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="border border-gray-200 p-12">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">{t.welcome}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t.creditsAdded}
            </p>
            <p className="text-xs text-gray-500">{t.redirecting}</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xs font-bold tracking-widest mb-8">{t.createAccount}</h2>

          <form onSubmit={handleSignup} className="space-y-6">
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

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium mb-2 tracking-wide">
                {t.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input"
                placeholder={t.confirmPasswordPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? t.creating : t.createAccountButton}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-600">{t.alreadyHaveAccount} </span>
            <Link href="/auth/login" className="underline hover:no-underline">
              {t.signInLink}
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-mono">
              {t.freeCredits}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <LanguageProvider>
      <SignupForm />
    </LanguageProvider>
  );
}
