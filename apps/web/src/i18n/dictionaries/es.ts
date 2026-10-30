import type { Dictionary } from "./pt-br";

const COPY_LINK = { title: 'Toca "Copiar enlace".' };
const PASTE_LINK = { title: 'Pega el enlace en Nowvi y toca "Descargar ahora".' };

export const es = {
  home: {
    title: "Nowvi: descargar videos de TikTok, X y Facebook",
    description:
      "Descarga videos de TikTok, X y Facebook sin marca de agua y sin registrarte. Gratis hasta 720p y sin guardar nada en el servidor.",
    keywords: [
      "descargar video de tiktok sin marca de agua",
      "descargar video de x",
      "descargar video de twitter",
      "descargar video de facebook mp4",
      "descargar reels de facebook",
      "guardar videos de tiktok",
      "descargador de videos online",
    ],
    heading: "Descarga videos de cualquier red, en un solo lugar.",
    highlight: "en un solo lugar.",
    subtitle: "Guarda en tu teléfono videos de TikTok, posts de X y videos de Facebook en segundos.",
    steps: [
      {
        title: "Copia el enlace del video",
        text: "En TikTok, X o Facebook, toca Compartir y luego Copiar enlace.",
      },
      {
        title: "Pégalo en Nowvi y toca Descargar",
        text: "Usa el botón Pegar o pega el enlace en el campo. Nowvi encuentra el video en segundos.",
      },
      {
        title: "Elige la calidad y guárdalo",
        text: "Descarga gratis hasta 720p después de un anuncio de 30 segundos.",
      },
    ],
    faq: [
      {
        question: "¿Es gratis descargar videos en Nowvi?",
        answer: "Sí. Hasta 720p es gratis y sin límite, después de 30 segundos de anuncio.",
      },
      {
        question: "¿Funciona en iPhone y Android?",
        answer:
          "Sí. Nowvi funciona en el navegador de cualquier iPhone, Android, tableta o computadora, sin instalar nada.",
      },
      {
        question: "¿Nowvi guarda los videos que descargo?",
        answer: "No. El video se extrae y te llega al momento, y no queda ninguna copia en el servidor.",
      },
      {
        question: "¿Cómo descargar un video de TikTok sin marca de agua?",
        answer:
          'Abre el video, toca Compartir y luego "Copiar enlace". Pega el enlace en Nowvi y el video sale sin el logo de TikTok.',
      },
      {
        question: "¿Por qué algunos videos no tienen audio?",
        answer:
          "Por lo general, la red de origen bloqueó la música con licencia. Cuando el original tiene audio, Nowvi descarga la versión con audio.",
      },
    ],
  },
  landings: {
    tiktok: {
      slug: "descargar-video-tiktok",
      network: "TikTok",
      title: "Descargar Video de TikTok sin Marca de Agua | Nowvi",
      description:
        "Descarga videos de TikTok en MP4 sin la marca de agua de la app y sin registrarte. Gratis hasta 720p.",
      heading: "Descargar video de TikTok sin marca de agua",
      subtitle: "Pega el enlace de TikTok y descarga el video limpio, sin el logo flotante.",
      steps: [{ title: "Abre el video y toca Compartir (la flecha de la derecha)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "¿Nowvi quita la marca de agua de TikTok?",
          answer: "Sí. El video sale sin el logo y sin el @ flotante.",
        },
        {
          question: "¿El video conserva el audio original?",
          answer: "Sí, con el audio sincronizado tal como se publicó.",
        },
        {
          question: "¿Funciona en iPhone?",
          answer: "Sí. Funciona en Safari en iPhone y en Chrome en Android, sin app.",
        },
        { question: "¿Puedo descargar videos de cuentas privadas?", answer: "No. Solo funcionan los videos públicos." },
      ],
    },
    x: {
      slug: "descargar-video-twitter",
      network: "X (Twitter)",
      title: "Descargar Video de X (Twitter) en MP4 | Nowvi",
      description: "Descarga videos de posts de X (antes Twitter) en MP4, sin registrarte. Gratis hasta 720p.",
      heading: "Descargar video de X (Twitter)",
      subtitle: "Pega el enlace del post y guarda el video de X en tu teléfono o computadora.",
      steps: [{ title: "Abre el post y toca el ícono de compartir, debajo del post." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "¿Descarga videos de cualquier post de X?",
          answer: "De posts públicos, sí. Las cuentas protegidas no funcionan.",
        },
        {
          question: "¿Funcionan los enlaces de twitter.com?",
          answer: "Sí. Nowvi acepta enlaces de x.com y de twitter.com.",
        },
        { question: "¿El video trae audio?", answer: "Sí, cuando el post original tiene sonido." },
        {
          question: "¿Por qué algunos posts dan error?",
          answer: "Si el post se borró, está protegido o no tiene video, no hay nada que descargar.",
        },
      ],
    },
    facebook: {
      slug: "descargar-video-facebook",
      network: "Facebook",
      title: "Descargar Video de Facebook en MP4 | Nowvi",
      description: "Descarga videos y Reels de Facebook en MP4 sin iniciar sesión. Gratis hasta 720p.",
      heading: "Descargar video de Facebook",
      subtitle: "Pega el enlace del video o Reel de Facebook y descárgalo sin necesidad de app.",
      steps: [{ title: "Abre el video y toca los tres puntos (•••) o Compartir." }, COPY_LINK, PASTE_LINK],
      faq: [
        { question: "¿Descarga videos de páginas o grupos?", answer: "Sí, si la página o el grupo es público." },
        { question: "¿Funcionan los enlaces fb.watch?", answer: "Sí. Nowvi acepta fb.watch y facebook.com." },
        { question: "¿Descarga Reels de Facebook?", answer: "Sí, Reels públicos en MP4." },
        {
          question: "¿Por qué a veces falla la descarga?",
          answer: "Los videos borrados, privados o restringidos no están disponibles.",
        },
      ],
    },
  },
  pausedLandings: {
    instagram: {
      slug: "descargar-video-instagram",
      network: "Instagram",
      title: "Descargar Video de Instagram sin Marca de Agua | Nowvi",
      description: "Descarga Reels, Stories y posts de Instagram en MP4 sin instalar nada. Gratis hasta 720p.",
      heading: "Descargar video de Instagram",
      subtitle: "Reels, Stories y posts en segundos, directo en el navegador, sin registro y sin app.",
      steps: [{ title: "Abre el Reel, Story o post y toca el avión de papel (Compartir)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "¿Nowvi descarga Reels, Stories y posts?",
          answer: "Sí. Nowvi descarga Reels, Stories y posts públicos de Instagram en MP4.",
        },
        {
          question: "¿Necesito una cuenta de Instagram?",
          answer: "No. Basta con el enlace público del video, sin iniciar sesión en Instagram ni en Nowvi.",
        },
        {
          question: "¿Por qué no funcionan los videos de perfiles privados?",
          answer:
            "Nowvi solo accede a contenido público. Un enlace de una cuenta privada muestra el aviso de video privado.",
        },
        {
          question: "¿En qué formato sale el video?",
          answer: "En MP4 con audio, que se abre en cualquier teléfono y en WhatsApp.",
        },
      ],
    },
  },
  header: { howItWorks: "Cómo funciona", language: "Idioma" },
  hero: { badge: "Gratis hasta 720p • Sin registro" },
  howItWorks: { eyebrow: "Simple • Rápido • Directo", title: "Cómo funciona Nowvi" },
  faq: { eyebrow: "¿Tienes dudas?", title: "Preguntas frecuentes" },
  networks: { title: "Descargar de una red específica", all: "Todas las redes" },
  legal: {
    terms: {
      title: "Términos de uso",
      text: "Nowvi es una herramienta para descargar videos públicos de TikTok, X y Facebook para uso personal. Úsala solo con contenido propio o que tengas permiso para descargar; volver a publicar material de terceros sin autorización es responsabilidad de quien lo descarga. Nowvi no aloja ni distribuye videos: cada descarga se extrae al momento de la fuente pública indicada. Nowvi puede rechazar o interrumpir descargas en cualquier momento. Usar el sitio implica aceptar estos términos y la legislación brasileña.",
    },
    privacy: {
      title: "Política de privacidad",
      text: "Nowvi no pide registro, inicio de sesión ni datos personales; el único dato que se procesa es el enlace del video. No se almacena ningún video. Solo guardamos métricas agregadas (red y calidad descargada), sin vincularlas a ninguna persona, conforme a la LGPD de Brasil (Ley 13.709/2018). Tu navegador guarda solo tu elección de cookies, y los anuncios solo cargan si aceptas; puedes cambiarla en “Preferencias de cookies”, en el pie de página. Para frenar abusos, el servidor usa tu IP unos minutos, solo en memoria, sin guardarla. Dudas sobre tus datos: contato@nowvi.com.br.",
    },
    dmca: {
      title: "Retiro de contenido (DMCA)",
      text: "Nowvi no aloja videos: el archivo se extrae de la fuente pública cuando alguien lo pide, sin copia en el servidor. Quien tenga derechos sobre un video puede pedir el bloqueo del enlace en contato@nowvi.com.br, enviando el enlace y una prueba de titularidad. Cada notificación se analiza y puede llevar al bloqueo de la extracción de ese enlace. El retiro del contenido original debe pedirse a la plataforma de origen.",
    },
  },
  footer: {
    tagline: "La forma más rápida de guardar videos de TikTok, X y Facebook en tu teléfono.",
    legalNav: "Enlaces legales",
    contact: "Contacto",
    cookiePreferences: "Preferencias de cookies",
    disclaimer: "No estamos afiliados a las redes sociales mencionadas.",
  },
  notFound: {
    title: "Página no encontrada.",
    text: "La dirección que abriste no existe.",
    back: "Volver al inicio",
  },
  offers: { free: "Gratis hasta 720p", fullHd: "Full HD 1080p" },
  client: {
    features: { fullHdPix: false },
    errors: {
      invalid_url: "Ese enlace no parece válido. Copia el enlace completo del video, empezando por https://.",
      unsupported_platform: "Por ahora, Nowvi descarga videos de TikTok, X y Facebook.",
      platform_unavailable:
        "Instagram no está disponible por el momento. Por ahora, Nowvi descarga videos de TikTok, X y Facebook.",
      too_long: "Este video dura más de 15 minutos. Por ahora, Nowvi descarga videos de hasta 15 minutos.",
      not_found: "No encontramos este video. Puede ser privado, haberse borrado o el post no tiene video.",
      rate_limited: "Demasiadas búsquedas en poco tiempo. Espera unos segundos e inténtalo de nuevo.",
      extract_failed: "No pudimos leer este video ahora. Inténtalo de nuevo en un momento.",
      busy: "Tenemos muchas descargas en este momento. Inténtalo de nuevo en un momento.",
      too_early: "La descarga todavía no está lista. Espera a que termine la cuenta regresiva.",
      expired: "Este enlace de descarga caducó. Haz una nueva búsqueda.",
      payments_disabled: "Las descargas de pago llegan pronto. Por ahora, descarga gratis en 720p.",
      invalid_token: "El enlace de descarga no es válido. Busca el video de nuevo.",
      unknown: "Algo salió mal. Inténtalo de nuevo en un momento.",
    },
    downloader: {
      label: "Descargar video",
      newSearch: "Nueva búsqueda",
      ready: "Video listo para descargar",
      inputLabel: "Enlace del video",
      placeholder: "Pega aquí el enlace del video",
      paste: "Pegar",
      submit: "Descargar ahora",
      loading: "Buscando video…",
      worksWith: "Funciona con",
    },
    quality: {
      title: "Elige cómo descargar",
      oneOption: "1 opción",
      twoOptions: "2 opciones",
      recommended: "Recomendado",
      fullHdText: "Sin anuncios, a máxima velocidad y disponible al instante.",
      instant: "Descarga instantánea",
      sharp: "Nitidez original",
      unlockPix: "Desbloquear Full HD",
      free: "Gratis",
      upTo: "hasta {quality}",
      freeText: "Mira un anuncio corto de 30 segundos y descarga sin pagar nada.",
      freeLegend: "Calidad de la descarga gratis",
      freeButton: "Descargar gratis ({quality})",
    },
    waiting: {
      badge: "Acceso gratuito",
      titles: {
        waiting: "Liberando tu descarga…",
        ready: "Tu descarga está lista",
        downloading: "Tu video se está descargando",
      },
      announcements: { waiting: "", ready: "Descarga lista", downloading: "Descarga iniciada" },
      downloadingHint: "Revisa la carpeta de descargas de tu teléfono o computadora.",
      readyHint: "Toca Descargar ahora para guardar el video.",
      unlocksIn: "Tu descarga se libera en",
      keepOpen: "Por favor, mantén esta pantalla abierta.",
      started: "La descarga empezó. Si no se abre, toca Descargar de nuevo.",
      newVideo: "Descargar otro video",
      again: "Descargar de nuevo",
      otherQuality: "Descargar en otra calidad",
      download: "Descargar ahora",
      waitingAd: "Esperando el anuncio ({seconds}s)…",
      progress: "Progreso de la liberación",
      skipTitle: "¿Quieres saltarte la espera?",
      skipText: "Descarga al instante, sin anuncios y en Full HD 1080p.",
      skipButton: "Descargar en Full HD",
      file: "Video {quality} en {ext}",
      share: {
        preparing: "Preparando el envío…",
        send: "Enviar por WhatsApp",
        prepare: "Preparar {quality} para WhatsApp",
        failed: "No se pudo. Descárgalo y envíalo",
        shareLink: "Compartir enlace",
        linkText: "Descarga videos de TikTok, X y Facebook gratis con Nowvi: {url}",
      },
    },
    pix: {
      title: "Full HD 1080p",
      description: "Pago único, sin suscripción.",
      detail: "Full HD 1080p",
      total: "Total a pagar",
      free: "Descargar gratis (720p)",
      close: "Cerrar",
    },
    ad: {
      label: "Publicidad",
      title: "Los anuncios mantienen Nowvi gratis",
      text: "Gracias por mirar. Cada anuncio nos ayuda a que las descargas sigan siendo gratis y sin límite.",
      upgrade: "Quiero el Full HD",
    },
    cookie: {
      label: "Aviso de cookies",
      text: "Usamos cookies para mostrar anuncios, conforme a la ley de protección de datos.",
      decline: "Rechazar",
      accept: "Aceptar",
    },
    theme: { toggle: "Cambiar modo oscuro" },
  },
} satisfies Dictionary;
