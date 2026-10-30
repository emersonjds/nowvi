import { ChevronDownIcon } from "lucide-react";

import type { Dictionary } from "@/i18n/dictionaries/pt-br";

import type { Question } from "../_content/landings";

export const Faq = ({ questions, copy }: { questions: Question[]; copy: Dictionary["faq"] }) => (
  <section aria-labelledby="faq-titulo" className="flex flex-col gap-6">
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-primary text-xs font-semibold tracking-widest uppercase">{copy.eyebrow}</p>
      <h2 id="faq-titulo" className="text-2xl font-bold tracking-tight md:text-3xl">
        {copy.title}
      </h2>
    </div>
    <div className="flex flex-col gap-3">
      {questions.map(({ question, answer }) => (
        <details key={question} className="group bg-card rounded-2xl border px-4">
          {/* Safari keeps its own disclosure triangle unless the webkit marker is hidden. */}
          <summary className="focus-visible:ring-ring/50 flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-base font-semibold outline-none focus-visible:ring-3 [&::-webkit-details-marker]:hidden">
            {question}
            <ChevronDownIcon
              aria-hidden
              className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="text-muted-foreground pb-4 text-base">{answer}</p>
        </details>
      ))}
    </div>
  </section>
);
