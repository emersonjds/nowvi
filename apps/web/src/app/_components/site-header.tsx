import { LOCALES, type Locale } from "@/i18n/config";
import { getDictionary, type PageKey, pagePath } from "@/i18n/dictionary";

import { BrandLogo } from "./brand-logo";
import { LanguageMenu } from "./language-menu";

export const SiteHeader = ({ locale, page }: { locale: Locale; page: PageKey }) => {
  const copy = getDictionary(locale).header;
  const links = LOCALES.filter((other) => other !== locale).map((other) => ({
    locale: other,
    href: pagePath(other, page),
  }));

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <a href={pagePath(locale, "home")} className="flex min-h-11 items-center">
          <BrandLogo />
        </a>
        <nav className="flex items-center gap-1">
          <a
            href="#como-funciona"
            className="text-muted-foreground hover:text-foreground flex min-h-11 items-center rounded-lg px-3 text-sm font-medium"
          >
            {copy.howItWorks}
          </a>
          <LanguageMenu locale={locale} label={copy.language} links={links} />
        </nav>
      </div>
    </header>
  );
};
