import type { Dictionary } from "@/i18n/dictionaries/pt-br";

export const LEGAL_SECTIONS = [
  { key: "terms", id: "termos" },
  { key: "privacy", id: "privacidade" },
  { key: "dmca", id: "dmca" },
] as const;

export const LegalSections = ({ legal }: { legal: Dictionary["legal"] }) => (
  <div className="flex flex-col gap-8 border-t pt-12">
    {LEGAL_SECTIONS.map(({ key, id }) => (
      <section key={id} id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-20">
        <h2 id={`${id}-titulo`} className="mb-2 text-lg font-bold tracking-tight">
          {legal[key].title}
        </h2>
        <p className="text-muted-foreground text-sm text-pretty">{legal[key].text}</p>
      </section>
    ))}
  </div>
);
