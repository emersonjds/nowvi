"use client";

import { GlobeIcon } from "lucide-react";

import { LOCALE_COOKIE, LOCALE_INFO, type Locale } from "@/i18n/config";

type LanguageMenuProps = { locale: Locale; label: string; links: { locale: Locale; href: string }[] };

const remember = (locale: Locale) => {
  // biome-ignore lint/suspicious/noDocumentCookie: the proxy reads this cookie; Cookie Store API is missing in older Safari
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
};

export const LanguageMenu = ({ locale, label, links }: LanguageMenuProps) => (
  <details className="relative">
    <summary
      aria-label={`${label}: ${LOCALE_INFO[locale].name}`}
      className="text-muted-foreground hover:text-foreground flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold uppercase [&::-webkit-details-marker]:hidden"
    >
      <GlobeIcon className="size-5" aria-hidden />
      {locale.slice(0, 2)}
    </summary>
    <ul className="bg-popover text-popover-foreground absolute top-full right-0 z-50 mt-1 flex w-52 flex-col rounded-xl border p-1 shadow-lg">
      {links.map((link) => (
        <li key={link.locale}>
          <a
            href={link.href}
            hrefLang={LOCALE_INFO[link.locale].htmlLang}
            lang={LOCALE_INFO[link.locale].htmlLang}
            onClick={() => remember(link.locale)}
            className="hover:bg-muted flex min-h-11 items-center rounded-lg px-3 text-sm font-medium"
          >
            {LOCALE_INFO[link.locale].name}
          </a>
        </li>
      ))}
    </ul>
  </details>
);
