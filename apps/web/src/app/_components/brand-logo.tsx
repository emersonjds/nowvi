import { cn } from "cn";

export const BrandMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" aria-hidden className={cn("size-8 shrink-0", className)}>
    <rect width="64" height="64" rx="16" className="fill-primary" />
    <path
      d="M21 19.5v25c0 1.6 1.7 2.5 3 1.7l19.5-12.5c1.2-.8 1.2-2.6 0-3.4L24 17.8c-1.3-.8-3 .1-3 1.7z"
      className="fill-accent"
    />
    <circle cx="44.5" cy="18.5" r="5.5" className="fill-accent" />
  </svg>
);

/** The "i" dot is the lime accent, as in the Stitch logo. */
export const BrandLogo = ({ className }: { className?: string }) => (
  <span className={cn("inline-flex items-center gap-2 text-xl font-extrabold tracking-tight", className)}>
    <BrandMark />
    <span className="sr-only">Nowvi</span>
    <span aria-hidden className="text-foreground">
      Nowv
      <span className="relative">
        ı
        <span
          aria-hidden
          className="bg-accent absolute top-[0.08em] left-[60%] size-[0.3em] -translate-x-1/2 rounded-full"
        />
      </span>
    </span>
  </span>
);
