const SECTIONS = [
  {
    id: "termos",
    title: "Termos de Uso",
    text: "O Nowvi é uma ferramenta para baixar vídeos públicos de Instagram, TikTok, X e Facebook para uso pessoal. Use só para conteúdo próprio ou que você tem autorização para baixar; republicar material de terceiros sem permissão é responsabilidade de quem baixa. O Nowvi não hospeda nem distribui vídeos: cada download é extraído na hora, da fonte pública informada. O Full HD é pago uma vez por vídeo, no Pix. O Nowvi pode recusar ou interromper downloads a qualquer momento. Usar o site é aceitar estes termos e a lei brasileira.",
  },
  {
    id: "privacidade",
    title: "Política de Privacidade",
    text: "O Nowvi não pede cadastro, login nem dados pessoais; o único dado tratado é o link do vídeo. Nenhum vídeo fica armazenado. Guardamos só métricas agregadas (rede e qualidade baixada), sem ligar a uma pessoa, conforme a LGPD (Lei 13.709/2018). Cookies servem para medir tráfego e exibir anúncios, como diz o aviso de cookies. Dúvidas sobre dados: contato@nowvi.com.br.",
  },
  {
    id: "dmca",
    title: "Remoção de Conteúdo (DMCA)",
    text: "O Nowvi não hospeda vídeos: o arquivo é extraído da fonte pública quando alguém pede, sem cópia no servidor. Quem detém direitos sobre um vídeo pode pedir o bloqueio do link em contato@nowvi.com.br, enviando o link e a prova de titularidade. Toda notificação é analisada e pode levar ao bloqueio da extração daquele link. A remoção do conteúdo original deve ser pedida à plataforma de origem.",
  },
];

export const LegalSections = () => (
  <div className="flex flex-col gap-8 border-t pt-12">
    {SECTIONS.map((section) => (
      <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="scroll-mt-20">
        <h2 id={`${section.id}-titulo`} className="mb-2 text-lg font-bold tracking-tight">
          {section.title}
        </h2>
        <p className="text-muted-foreground text-sm text-pretty">{section.text}</p>
      </section>
    ))}
  </div>
);
