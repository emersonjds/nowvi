import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import type { Question } from "../_content/landings";

export const Faq = ({ questions }: { questions: Question[] }) => (
  <section aria-labelledby="faq-titulo" className="flex flex-col gap-6">
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-primary text-xs font-semibold tracking-widest uppercase">Tire suas dúvidas</p>
      <h2 id="faq-titulo" className="text-2xl font-bold tracking-tight md:text-3xl">
        Perguntas Frequentes
      </h2>
    </div>
    <Accordion type="single" collapsible className="gap-3">
      {questions.map((item) => (
        <AccordionItem key={item.question} value={item.question} className="bg-card rounded-2xl border px-4">
          <AccordionTrigger className="min-h-14 items-center py-4 text-base font-semibold hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-base">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);
