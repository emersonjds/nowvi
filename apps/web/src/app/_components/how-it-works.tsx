import type { Dictionary } from "@/i18n/dictionaries/pt-br";

import type { Step } from "../_content/landings";

type HowItWorksProps = { steps: Step[]; copy: Dictionary["howItWorks"] };

export const HowItWorks = ({ steps, copy }: HowItWorksProps) => (
  <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="flex scroll-mt-20 flex-col gap-6">
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-primary text-xs font-semibold tracking-widest uppercase">{copy.eyebrow}</p>
      <h2 id="como-funciona-titulo" className="text-2xl font-bold tracking-tight md:text-3xl">
        {copy.title}
      </h2>
    </div>
    <ol className="grid gap-4">
      {steps.map((step, index) => (
        <li key={step.title} className="bg-muted flex gap-4 rounded-2xl p-5">
          <span
            className={
              index === 2
                ? "bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
                : "bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
            }
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg leading-6 font-semibold">{step.title}</h3>
            {step.text && <p className="text-muted-foreground text-sm">{step.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  </section>
);
