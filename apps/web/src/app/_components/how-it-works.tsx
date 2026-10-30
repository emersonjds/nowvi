const STEPS = [
  {
    title: "Copie o link do vídeo",
    text: "No Instagram, TikTok, X ou Facebook, toque em Compartilhar e depois em Copiar link.",
  },
  {
    title: "Cole no Nowvi e toque em Baixar",
    text: "Use o botão Colar ou cole o link no campo. O Nowvi encontra o vídeo em segundos.",
  },
  {
    title: "Escolha a qualidade e salve",
    text: "Baixe grátis em até 720p depois de um anúncio de 30 segundos, ou em Full HD por R$ 2 no Pix.",
  },
];

export const HowItWorks = () => (
  <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="flex scroll-mt-20 flex-col gap-6">
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-primary text-xs font-semibold tracking-widest uppercase">Simples • Rápido • Direto</p>
      <h2 id="como-funciona-titulo" className="text-2xl font-bold tracking-tight md:text-3xl">
        Como funciona o Nowvi
      </h2>
    </div>
    <ol className="grid gap-4">
      {STEPS.map((step, index) => (
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
            <p className="text-muted-foreground text-sm">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);
