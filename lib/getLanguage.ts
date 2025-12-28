import { cookies } from "next/headers";
import { Language } from "./i18n";

export async function getLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get("language");
  return (languageCookie?.value as Language) || "en";
}
