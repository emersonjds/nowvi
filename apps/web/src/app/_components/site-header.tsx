import { ZapIcon } from "lucide-react";

import { LOCALES, type Locale } from "@/i18n/config";
import { getDictionary, type PageKey, pagePath } from "@/i18n/dictionary";

import { LanguageMenu } from "./language-menu";
import { ThemeToggle } from "./theme-toggle";

export const SiteHeader = ({ locale, page }: { locale: Locale; page: PageKey }) => {
  const copy = getDictionary(locale).header;
  const links = LOCALES.filter((other) => other !== locale).map((other) => ({
    locale: other,
    href: pagePath(other, page),
  }));

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <a
          href={pagePath(locale, "home")}
          className="text-primary flex min-h-11 items-center gap-1.5 text-xl font-extrabold tracking-tight"
        >
          <ZapIcon className="size-5 fill-current" aria-hidden />
          Nowvi
        </a>
        <nav className="flex items-center gap-1">
          <a
            href="#como-funciona"
            className="text-muted-foreground hover:text-foreground flex min-h-11 items-center rounded-lg px-3 text-sm font-medium"
          >
            {copy.howItWorks}
          </a>
          <LanguageMenu locale={locale} label={copy.language} links={links} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};
