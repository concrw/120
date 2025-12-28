"use client";

import { useLanguage } from "./LanguageProvider";
import { LANGUAGES, Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export default function LanguageSelector() {
  const { language: currentLanguage, setLanguage } = useLanguage();
  const router = useRouter();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    router.refresh();
  };

  return (
    <div className="flex gap-3">
      {Object.entries(LANGUAGES).map(([code, lang]) => (
        <button
          key={code}
          type="button"
          onClick={() => handleLanguageChange(code as Language)}
          className={`px-4 py-2 text-sm border transition-colors ${
            currentLanguage === code
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white text-black hover:border-gray-400"
          }`}
        >
          {lang.nativeName}
        </button>
      ))}
    </div>
  );
}
