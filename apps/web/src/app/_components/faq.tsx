import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const QUESTIONS = [
  {
    question: "É gratuito baixar vídeos no Nowvi?",
    answer:
      "Sim. O download em até 720p é grátis depois de um anúncio de 30 segundos, sem cadastro. O Full HD 1080p custa R$ 2,00 no Pix, sem anúncio.",
  },
  {
    question: "Funciona no iPhone e Android?",
    answer:
      "Sim. O Nowvi funciona no navegador de qualquer celular, tablet ou computador, como Safari, Chrome, Samsung Internet e Firefox. Não precisa instalar app.",
  },
  {
    question: "O Nowvi armazena os vídeos baixados?",
    answer: "Não. O vídeo vai direto da rede social para o seu aparelho. O Nowvi não guarda cópia nenhuma no servidor.",
  },
  {
    question: "Como baixar Reels do Instagram?",
    answer:
      "Abra o Reel no Instagram, toque em Compartilhar, depois em Copiar link. Volte ao Nowvi, toque em Colar e em Baixar Agora.",
  },
  {
    question: "Por que alguns vídeos não têm áudio?",
    answer:
      "Algumas músicas são licenciadas ou bloqueadas por região, e a rede social entrega o vídeo sem a faixa de áudio. O Nowvi sempre escolhe a versão com áudio quando ela existe.",
  },
];

export const Faq = () => (
  <section aria-labelledby="faq-titulo" className="flex flex-col gap-6">
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-primary text-xs font-semibold tracking-widest uppercase">Tire suas dúvidas</p>
      <h2 id="faq-titulo" className="text-2xl font-bold tracking-tight md:text-3xl">
        Perguntas Frequentes
      </h2>
    </div>
    <Accordion type="single" collapsible className="gap-3">
      {QUESTIONS.map((item) => (
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
