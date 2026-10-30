export const LOCALES = ["pt-br", "en", "es", "id"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "NOWVI_LOCALE";

export const LOCALE_INFO: Record<Locale, { htmlLang: string; ogLocale: string; name: string }> = {
  "pt-br": { htmlLang: "pt-BR", ogLocale: "pt_BR", name: "Português" },
  en: { htmlLang: "en", ogLocale: "en_US", name: "English" },
  es: { htmlLang: "es", ogLocale: "es_ES", name: "Español" },
  id: { htmlLang: "id", ogLocale: "id_ID", name: "Bahasa Indonesia" },
};

export const isLocale = (value: string | undefined): value is Locale => LOCALES.some((locale) => locale === value);
