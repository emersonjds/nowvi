import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";

export type Step = { title: string; text?: string };
export type Question = { question: string; answer: string };

export type PageContent = {
  path: string;
  title: string;
  description: string;
  heading: string;
  subtitle: string;
  steps: Step[];
  faq: Question[];
};

export type Landing = PageContent & { slug: string; network: string };

const COPY_LINK = { title: 'Toque em "Copiar link".' };
const PASTE_LINK = { title: 'Cole o link no Nowvi e toque em "Baixar Agora".' };

export const HOME: PageContent = {
  path: "/",
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
  heading: "Baixe vídeos de qualquer rede, num lugar só.",
  subtitle: "Reels do Instagram, vídeos do TikTok, posts do X e vídeos do Facebook salvos no seu celular em instantes.",
  steps: [
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
      question: "Como baixar Reels do Instagram?",
      answer:
        'Abra o Reel, toque em Compartilhar e depois em "Copiar link". Cole o link no Nowvi e toque em "Baixar Agora".',
    },
    {
      question: "Por que alguns vídeos não têm áudio?",
      answer:
        "Em geral, a música licenciada foi bloqueada na rede de origem. Quando o original tem áudio, o Nowvi baixa a versão com áudio.",
    },
  ],
};

export const LANDINGS: Landing[] = [
  {
    slug: "baixar-video-instagram",
    path: "/baixar-video-instagram",
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
  {
    slug: "baixar-video-tiktok",
    path: "/baixar-video-tiktok",
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
      { question: "Funciona no iPhone?", answer: "Sim. Funciona no Safari do iPhone e no Chrome do Android, sem app." },
      { question: "Baixa vídeo de conta privada?", answer: "Não. Só funcionam vídeos públicos." },
    ],
  },
  {
    slug: "baixar-video-x",
    path: "/baixar-video-x",
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
  {
    slug: "baixar-video-facebook",
    path: "/baixar-video-facebook",
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
];

// The root opengraph-image is dropped once a nested page sets its own openGraph.
const OG_IMAGE = "/opengraph-image";

export const pageMetadata = ({ path, title, description }: PageContent): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.name,
    locale: "pt_BR",
    url: path,
    title,
    description,
    images: OG_IMAGE,
  },
  twitter: { card: "summary_large_image", title, description, images: OG_IMAGE },
});
