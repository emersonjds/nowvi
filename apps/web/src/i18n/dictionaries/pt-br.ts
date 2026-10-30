import type { ErrorCode } from "@/lib/api";

const COPY_LINK = { title: 'Toque em "Copiar link".' };
const PASTE_LINK = { title: 'Cole o link no Nowvi e toque em "Baixar Agora".' };

export const ptBr = {
  home: {
    title: "Nowvi: baixar vídeo do TikTok, X e Facebook",
    description:
      "Baixe vídeos do TikTok, X e Facebook sem marca d'água e sem cadastro. Grátis até 720p; Full HD por R$ 2 no Pix. Nada fica salvo no servidor.",
    keywords: [
      "baixar vídeo tiktok sem marca d'água",
      "baixar vídeo do x",
      "baixar vídeo facebook mp4",
      "baixar reels facebook",
      "download tiktok sem cadastro",
      "baixar vídeo full hd",
      "baixador de vídeo online",
    ],
    heading: "Baixe vídeos de qualquer rede, num lugar só.",
    highlight: "num lugar só.",
    subtitle: "Vídeos do TikTok, posts do X e vídeos do Facebook salvos no seu celular em instantes.",
    steps: [
      {
        title: "Copie o link do vídeo",
        text: "No TikTok, X ou Facebook, toque em Compartilhar e depois em Copiar link.",
      },
      {
        title: "Cole no Nowvi e toque em Baixar",
        text: "Use o botão Colar ou cole o link no campo. O Nowvi encontra o vídeo em segundos.",
      },
      {
        title: "Escolha a qualidade e salve",
        text: "Baixe grátis em até 720p depois de um anúncio de 30 segundos, ou em Full HD por R$ 2 no Pix.",
      },
    ],
    faq: [
      {
        question: "É gratuito baixar vídeos no Nowvi?",
        answer:
          "Sim. Até 720p é grátis e sem limite, depois de 30 segundos de anúncio. O Full HD (1080p) custa R$ 2 por vídeo no Pix.",
      },
      {
        question: "Funciona no iPhone e Android?",
        answer:
          "Sim. O Nowvi funciona no navegador de qualquer iPhone, Android, tablet ou computador, sem instalar nada.",
      },
      {
        question: "O Nowvi armazena os vídeos baixados?",
        answer: "Não. O vídeo é extraído e enviado direto para você na hora, e nenhuma cópia fica no servidor.",
      },
      {
        question: "Como baixar vídeo do TikTok sem marca d'água?",
        answer:
          'Abra o vídeo, toque em Compartilhar e depois em "Copiar link". Cole o link no Nowvi e o vídeo sai sem o logo do TikTok.',
      },
      {
        question: "Por que alguns vídeos não têm áudio?",
        answer:
          "Em geral, a música licenciada foi bloqueada na rede de origem. Quando o original tem áudio, o Nowvi baixa a versão com áudio.",
      },
    ],
  },
  landings: {
    tiktok: {
      slug: "baixar-video-tiktok",
      network: "TikTok",
      title: "Baixar Vídeo do TikTok sem Marca d'Água | Nowvi",
      description:
        "Baixe vídeos do TikTok em MP4 sem a marca d'água do app e sem cadastro. Grátis até 720p; Full HD por R$ 2 no Pix.",
      heading: "Baixar vídeo do TikTok sem marca d'água",
      subtitle: "Cole o link do TikTok e baixe o vídeo limpo, sem o logo flutuante.",
      steps: [{ title: "Abra o vídeo e toque em Compartilhar (a seta à direita)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "O Nowvi remove a marca d'água do TikTok?",
          answer: "Sim. O vídeo sai sem o logo e sem o @ flutuante.",
        },
        { question: "O vídeo sai com o áudio original?", answer: "Sim, com o áudio sincronizado como foi publicado." },
        {
          question: "Funciona no iPhone?",
          answer: "Sim. Funciona no Safari do iPhone e no Chrome do Android, sem app.",
        },
        { question: "Baixa vídeo de conta privada?", answer: "Não. Só funcionam vídeos públicos." },
      ],
    },
    x: {
      slug: "baixar-video-x",
      network: "X (Twitter)",
      title: "Baixar Vídeo do X (Twitter) em MP4 | Nowvi",
      description:
        "Baixe vídeos de posts do X (antigo Twitter) em MP4, sem cadastro. Grátis até 720p; Full HD por R$ 2 no Pix.",
      heading: "Baixar vídeo do X (Twitter)",
      subtitle: "Cole o link do post e salve o vídeo do X no celular ou no computador.",
      steps: [{ title: "Abra o post e toque em compartilhar, abaixo do post." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Baixa vídeo de qualquer post do X?",
          answer: "Baixa de posts públicos. Contas protegidas não funcionam.",
        },
        { question: "Link do twitter.com funciona?", answer: "Sim. O Nowvi aceita links do x.com e do twitter.com." },
        { question: "O vídeo vem com áudio?", answer: "Sim, quando o post original tem som." },
        {
          question: "Por que alguns posts dão erro?",
          answer: "Post apagado, protegido ou sem vídeo não tem o que baixar.",
        },
      ],
    },
    facebook: {
      slug: "baixar-video-facebook",
      network: "Facebook",
      title: "Baixar Vídeo do Facebook em MP4 | Nowvi",
      description: "Baixe vídeos e Reels do Facebook em MP4 sem login. Grátis até 720p; Full HD por R$ 2 no Pix.",
      heading: "Baixar vídeo do Facebook",
      subtitle: "Cole o link do vídeo ou Reel do Facebook e baixe sem precisar de app.",
      steps: [{ title: "Abra o vídeo e toque nos três pontos (•••) ou em Compartilhar." }, COPY_LINK, PASTE_LINK],
      faq: [
        { question: "Baixa vídeo de página ou grupo?", answer: "Sim, se a página ou o grupo for público." },
        { question: "Link fb.watch funciona?", answer: "Sim. O Nowvi aceita fb.watch e facebook.com." },
        { question: "Baixa Reels do Facebook?", answer: "Sim, Reels públicos em MP4." },
        {
          question: "Por que o download falha às vezes?",
          answer: "Vídeo apagado, privado ou restrito não fica disponível.",
        },
      ],
    },
  },
  // Instagram is paused until NOWVI-20 restores extraction; move it back into `landings` then.
  pausedLandings: {
    instagram: {
      slug: "baixar-video-instagram",
      network: "Instagram",
      title: "Baixar Vídeo do Instagram sem Marca d'Água | Nowvi",
      description:
        "Baixe Reels, Stories e posts do Instagram em MP4 sem instalar nada. Grátis até 720p; Full HD por R$ 2 no Pix.",
      heading: "Baixar vídeo do Instagram",
      subtitle: "Reels, Stories e posts em segundos, direto no navegador, sem cadastro e sem app.",
      steps: [{ title: "Abra o Reel, Story ou post e toque no avião de papel (Compartilhar)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "O Nowvi baixa Reels, Stories e posts?",
          answer: "Sim. O Nowvi baixa Reels, Stories e posts públicos do Instagram em MP4.",
        },
        {
          question: "Preciso ter conta no Instagram?",
          answer: "Não. Basta o link público do vídeo, sem login no Instagram nem no Nowvi.",
        },
        {
          question: "Por que vídeo de perfil privado não funciona?",
          answer: "O Nowvi só acessa conteúdo público. Link de conta privada mostra o aviso de vídeo privado.",
        },
        {
          question: "Em que formato o vídeo sai?",
          answer: "Sai em MP4 com áudio, que abre em qualquer celular e no WhatsApp.",
        },
      ],
    },
  },
  header: { howItWorks: "Como funciona", language: "Idioma" },
  hero: { badge: "Grátis até 720p • Sem cadastro" },
  howItWorks: { eyebrow: "Simples • Rápido • Direto", title: "Como funciona o Nowvi" },
  faq: { eyebrow: "Tire suas dúvidas", title: "Perguntas Frequentes" },
  networks: { title: "Baixar de uma rede específica", all: "Todas as redes" },
  legal: {
    terms: {
      title: "Termos de Uso",
      text: "O Nowvi é uma ferramenta para baixar vídeos públicos de TikTok, X e Facebook para uso pessoal. Use só para conteúdo próprio ou que você tem autorização para baixar; republicar material de terceiros sem permissão é responsabilidade de quem baixa. O Nowvi não hospeda nem distribui vídeos: cada download é extraído na hora, da fonte pública informada. O Full HD é pago uma vez por vídeo, no Pix. O Nowvi pode recusar ou interromper downloads a qualquer momento. Usar o site é aceitar estes termos e a lei brasileira.",
    },
    privacy: {
      title: "Política de Privacidade",
      text: "O Nowvi não pede cadastro, login nem dados pessoais; o único dado tratado é o link do vídeo. Nenhum vídeo fica armazenado. Guardamos só métricas agregadas (rede e qualidade baixada), sem ligar a uma pessoa, conforme a LGPD (Lei 13.709/2018). O navegador guarda só a sua escolha de cookies, e os anúncios só carregam se você aceitar; dá para mudar em “Preferências de cookies”, no rodapé. Para conter abuso, o servidor usa o seu IP por alguns minutos, só em memória, sem gravar. Dúvidas sobre dados: contato@nowvi.com.br.",
    },
    dmca: {
      title: "Remoção de Conteúdo (DMCA)",
      text: "O Nowvi não hospeda vídeos: o arquivo é extraído da fonte pública quando alguém pede, sem cópia no servidor. Quem detém direitos sobre um vídeo pode pedir o bloqueio do link em contato@nowvi.com.br, enviando o link e a prova de titularidade. Toda notificação é analisada e pode levar ao bloqueio da extração daquele link. A remoção do conteúdo original deve ser pedida à plataforma de origem.",
    },
  },
  footer: {
    tagline: "O jeito mais rápido de salvar vídeos do TikTok, X e Facebook no seu celular.",
    legalNav: "Links legais",
    contact: "Contato",
    cookiePreferences: "Preferências de cookies",
    disclaimer: "Não somos afiliados às redes sociais citadas.",
  },
  notFound: {
    title: "Página não encontrada.",
    text: "O endereço que você abriu não existe.",
    back: "Voltar para o início",
  },
  offers: { free: "Grátis até 720p", fullHd: "Full HD 1080p" },
  llms: { pages: "Páginas", languages: "Idiomas", fullText: "Todas as perguntas frequentes, em todos os idiomas." },
  client: {
    features: { fullHdPix: true },
    errors: {
      invalid_url: "Esse link não parece válido. Copie o link completo do vídeo, começando com https://.",
      unsupported_platform: "Por enquanto o Nowvi baixa vídeos do TikTok, X e Facebook.",
      platform_unavailable:
        "O Instagram está temporariamente indisponível. Por enquanto, o Nowvi baixa vídeos do TikTok, X e Facebook.",
      too_long: "Esse vídeo passa de 15 minutos. Por enquanto, o Nowvi baixa vídeos de até 15 minutos.",
      not_found: "Não achamos esse vídeo. Ele pode ser privado, ter sido apagado ou o post não tem vídeo.",
      rate_limited: "Muitas buscas em pouco tempo. Espere alguns segundos e tente de novo.",
      extract_failed: "Não conseguimos ler esse vídeo agora. Tente de novo em instantes.",
      busy: "Estamos com muitos downloads agora. Tente de novo em instantes.",
      too_early: "O download ainda não foi liberado. Espere a contagem terminar.",
      expired: "Esse link de download expirou. Faça uma nova busca.",
      payments_disabled: "O Pix chega em breve. Por enquanto, baixe grátis em 720p.",
      invalid_token: "O link de download não é válido. Busque o vídeo de novo.",
      unknown: "Algo deu errado. Tente de novo em instantes.",
    } satisfies Record<ErrorCode, string>,
    downloader: {
      label: "Baixar vídeo",
      newSearch: "Nova busca",
      ready: "Vídeo pronto para download",
      inputLabel: "Link do vídeo",
      placeholder: "Cole o link do vídeo aqui",
      paste: "Colar",
      submit: "Baixar Agora",
      loading: "Buscando vídeo…",
      worksWith: "Funciona com",
    },
    quality: {
      title: "Escolha como baixar",
      oneOption: "1 opção",
      twoOptions: "2 opções",
      recommended: "Recomendado",
      fullHdText: "Sem anúncio, na velocidade máxima e liberado na hora pelo Pix.",
      instant: "Download instantâneo",
      sharp: "Nitidez original",
      unlockPix: "Liberar Full HD com Pix",
      free: "Grátis",
      upTo: "até {quality}",
      freeText: "Assista a um anúncio curto de 30 segundos e baixe sem pagar nada.",
      freeLegend: "Qualidade do download grátis",
      freeButton: "Baixar grátis ({quality})",
    },
    waiting: {
      badge: "Acesso gratuito",
      titles: {
        waiting: "Liberando seu download…",
        ready: "Seu download está liberado",
        downloading: "Seu vídeo está sendo baixado",
      },
      announcements: { waiting: "", ready: "Download liberado", downloading: "Download iniciado" },
      downloadingHint: "Confira a pasta de downloads do celular ou do computador.",
      readyHint: "Toque em Baixar agora para salvar o vídeo.",
      unlocksIn: "Seu download libera em",
      keepOpen: "Por favor, mantenha esta tela aberta.",
      started: "O download começou. Se não abrir, toque em Baixar de novo.",
      newVideo: "Baixar novo vídeo",
      again: "Baixar de novo",
      otherQuality: "Baixar em outra qualidade",
      download: "Baixar agora",
      waitingAd: "Aguardando anúncio ({seconds}s)…",
      progress: "Progresso da liberação",
      skipTitle: "Quer pular a espera?",
      skipText: "Baixe na hora, sem anúncio e em Full HD 1080p.",
      skipButton: "Baixar em Full HD por R$ 2,00 no Pix",
      file: "Vídeo {quality} em {ext}",
      share: {
        preparing: "Preparando envio…",
        send: "Enviar no WhatsApp",
        prepare: "Preparar {quality} para WhatsApp",
        failed: "Não deu, baixe e envie",
        shareLink: "Compartilhar link",
        linkText: "Baixe vídeos do TikTok, X e Facebook de graça no Nowvi: {url}",
      },
    },
    pix: {
      title: "Full HD 1080p com Pix",
      description: "Cobrança única de R$ 2,00, sem assinatura.",
      detail: "Full HD 1080p",
      total: "Total a pagar",
      free: "Baixar Grátis (720p)",
      close: "Fechar",
    },
    ad: {
      label: "Publicidade",
      title: "Full HD 1080p sem anúncio",
      text: "Por R$ 2,00 no Pix o download sai na hora, sem espera e na melhor qualidade.",
      upgrade: "Quero o Full HD",
    },
    cookie: {
      label: "Aviso de cookies",
      text: "Usamos cookies para exibir anúncios, conforme a LGPD.",
      decline: "Recusar",
      accept: "Aceitar",
    },
    theme: { toggle: "Alternar modo escuro" },
  },
};

export type Dictionary = typeof ptBr;
export type ClientDictionary = Dictionary["client"];
