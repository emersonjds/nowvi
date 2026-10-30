import { ZapIcon } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";

export const SiteHeader = () => (
  <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
      <a href="/" className="text-primary flex min-h-11 items-center gap-1.5 text-xl font-extrabold tracking-tight">
        <ZapIcon className="size-5 fill-current" aria-hidden />
        Nowvi
      </a>
      <nav className="flex items-center gap-1">
        <a
          href="#como-funciona"
          className="text-muted-foreground hover:text-foreground flex min-h-11 items-center rounded-lg px-3 text-sm font-medium"
        >
          Como funciona
        </a>
        <ThemeToggle />
      </nav>
    </div>
  </header>
);
