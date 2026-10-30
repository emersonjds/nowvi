import { ZapIcon } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

const LINKS = ["Termos de Uso", "Política de Privacidade", "Remoção de Conteúdo (DMCA)", "Contato"];

export const SiteFooter = () => (
  <footer className="bg-muted border-t">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
      <p className="text-primary flex items-center gap-1.5 text-xl font-extrabold">
        <ZapIcon className="size-5 fill-current" aria-hidden />
        Nowvi
      </p>
      <p className="text-muted-foreground max-w-md text-sm">
        O jeito mais rápido de salvar vídeos do Instagram, TikTok, X e Facebook no seu celular.
      </p>
      <nav aria-label="Links legais">
        <ul className="flex flex-wrap justify-center gap-x-2">
          {LINKS.map((label) => (
            <li key={label}>
              {/* biome-ignore lint/a11y/useValidAnchor: placeholder until the legal pages exist */}
              <a href="#" className="hover:text-primary flex min-h-11 items-center px-2 text-sm">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="text-muted-foreground text-xs">{APP_CONFIG.copyright}</p>
    </div>
  </footer>
);
