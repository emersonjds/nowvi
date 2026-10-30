import type { Locale } from "@/i18n/config";
import { getDictionary, pagePath } from "@/i18n/dictionary";

import { BrandLogo } from "./brand-logo";
import { LEGAL_SECTIONS } from "./legal-sections";

export const SiteFooter = ({ locale }: { locale: Locale }) => {
  const dictionary = getDictionary(locale);
  const homePath = pagePath(locale, "home");
  const links = [
    ...LEGAL_SECTIONS.map(({ key, id }) => ({ label: dictionary.legal[key].title, href: `${homePath}#${id}` })),
    { label: dictionary.footer.contact, href: "mailto:contato@nowvi.com.br" },
  ];

  return (
    <footer className="bg-muted border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="text-primary flex items-center gap-1.5 text-xl font-extrabold">
          <BrandLogo />
        </p>
        <p className="text-muted-foreground max-w-md text-sm">{dictionary.footer.tagline}</p>
        <nav aria-label={dictionary.footer.legalNav}>
          <ul className="flex flex-wrap justify-center gap-x-2">
            {links.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="hover:text-primary flex min-h-11 items-center px-2 text-sm">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Nowvi. {dictionary.footer.disclaimer}
        </p>
      </div>
    </footer>
  );
};
