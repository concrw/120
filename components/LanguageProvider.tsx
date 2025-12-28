"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Language } from "@/lib/i18n";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: "en",
  setLanguage: () => {},
});

function getLanguageFromCookie(): Language {
  if (typeof document === "undefined") return "en";

  const cookies = document.cookie.split(";");
  const languageCookie = cookies.find((c) => c.trim().startsWith("language="));

  if (languageCookie) {
    const lang = languageCookie.split("=")[1].trim() as Language;
    return lang;
  }

  return "en";
}

export function LanguageProvider({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || "en");

  useEffect(() => {
    // Read language from cookie on mount if not provided
    if (!initialLanguage) {
      const cookieLang = getLanguageFromCookie();
      setLanguageState(cookieLang);
    }
  }, [initialLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Save to cookie for server-side access
    document.cookie = `language=${lang}; path=/; max-age=31536000`; // 1 year
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
