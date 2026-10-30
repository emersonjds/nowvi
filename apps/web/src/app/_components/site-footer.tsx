import { ZapIcon } from "lucide-react";

import type { Dictionary } from "@/i18n/dictionaries/pt-br";

import { LEGAL_SECTIONS } from "./legal-sections";

type SiteFooterProps = { dictionary: Dictionary; homePath: string };

export const SiteFooter = ({ dictionary, homePath }: SiteFooterProps) => {
  const links = [
    ...LEGAL_SECTIONS.map(({ key, id }) => ({ label: dictionary.legal[key].title, href: `${homePath}#${id}` })),
    { label: dictionary.footer.contact, href: "mailto:contato@nowvi.com.br" },
  ];

  return (
    <footer className="bg-muted border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="text-primary flex items-center gap-1.5 text-xl font-extrabold">
          <ZapIcon className="size-5 fill-current" aria-hidden />
          Nowvi
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
