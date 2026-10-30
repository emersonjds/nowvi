import type { Dictionary } from "./pt-br";

const COPY_LINK = { title: 'Ketuk "Salin link".' };
const PASTE_LINK = { title: 'Tempel link di Nowvi lalu ketuk "Download Sekarang".' };

export const id = {
  home: {
    title: "Nowvi: Download Video TikTok, X, dan Facebook",
    description:
      "Download video TikTok, X, dan Facebook tanpa watermark dan tanpa daftar. Gratis sampai 720p, dan tidak ada yang disimpan di server.",
    keywords: [
      "download video tiktok tanpa watermark",
      "download video x",
      "download video twitter",
      "download video facebook mp4",
      "download reels facebook",
      "simpan video tiktok",
      "situs download video online",
    ],
    heading: "Download video dari media sosial mana pun, cukup di satu tempat.",
    highlight: "cukup di satu tempat.",
    subtitle: "Simpan video TikTok, postingan X, dan video Facebook ke HP kamu dalam hitungan detik.",
    steps: [
      {
        title: "Salin link videonya",
        text: "Di TikTok, X, atau Facebook, ketuk Bagikan lalu Salin link.",
      },
      {
        title: "Tempel di Nowvi lalu ketuk Download",
        text: "Pakai tombol Tempel atau tempel link di kolom. Nowvi menemukan videonya dalam hitungan detik.",
      },
      {
        title: "Pilih kualitas dan simpan",
        text: "Download gratis sampai 720p setelah iklan 30 detik.",
      },
    ],
    faq: [
      {
        question: "Apakah download video di Nowvi gratis?",
        answer: "Ya. Sampai 720p gratis dan tanpa batas, setelah iklan 30 detik.",
      },
      {
        question: "Bisa dipakai di iPhone dan Android?",
        answer:
          "Bisa. Nowvi jalan di browser iPhone, Android, tablet, atau komputer apa pun, tanpa perlu instal apa-apa.",
      },
      {
        question: "Apakah Nowvi menyimpan video yang saya download?",
        answer: "Tidak. Video diambil dan langsung dikirim ke kamu, dan tidak ada salinan yang tersimpan di server.",
      },
      {
        question: "Bagaimana cara download video TikTok tanpa watermark?",
        answer:
          'Buka videonya, ketuk Bagikan lalu "Salin link". Tempel link di Nowvi dan videonya keluar tanpa logo TikTok.',
      },
      {
        question: "Kenapa ada video yang tidak ada suaranya?",
        answer:
          "Biasanya musik berlisensi diblokir di aplikasi aslinya. Kalau video aslinya ada suara, Nowvi mengunduh versi yang ada suaranya.",
      },
    ],
  },
  landings: {
    tiktok: {
      slug: "download-video-tiktok",
      network: "TikTok",
      title: "Download Video TikTok Tanpa Watermark | Nowvi",
      description: "Download video TikTok dalam format MP4 tanpa watermark dan tanpa daftar. Gratis sampai 720p.",
      heading: "Download video TikTok tanpa watermark",
      subtitle: "Tempel link TikTok dan download videonya dalam kondisi bersih, tanpa logo yang melayang.",
      steps: [{ title: "Buka videonya lalu ketuk Bagikan (panah di sebelah kanan)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Apakah Nowvi menghapus watermark TikTok?",
          answer: "Ya. Videonya keluar tanpa logo dan tanpa @ yang melayang.",
        },
        {
          question: "Apakah audio aslinya tetap ada?",
          answer: "Ya, dengan audio yang sinkron seperti saat diunggah.",
        },
        {
          question: "Bisa di iPhone?",
          answer: "Bisa. Jalan di Safari di iPhone dan Chrome di Android, tanpa aplikasi.",
        },
        { question: "Bisa download video dari akun privat?", answer: "Tidak. Hanya video publik yang bisa." },
      ],
    },
    x: {
      slug: "download-video-twitter",
      network: "X (Twitter)",
      title: "Download Video X (Twitter) MP4 | Nowvi",
      description: "Download video dari postingan X (dulu Twitter) dalam format MP4, tanpa daftar. Gratis sampai 720p.",
      heading: "Download video X (Twitter)",
      subtitle: "Tempel link postingannya dan simpan video X ke HP atau komputer kamu.",
      steps: [{ title: "Buka postingannya lalu ketuk ikon bagikan di bawahnya." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Bisa download video dari postingan X mana pun?",
          answer: "Bisa dari postingan publik. Akun yang dilindungi tidak bisa.",
        },
        { question: "Apakah link twitter.com bisa?", answer: "Bisa. Nowvi menerima link x.com dan twitter.com." },
        { question: "Apakah videonya ada suaranya?", answer: "Ya, selama postingan aslinya ada suara." },
        {
          question: "Kenapa ada postingan yang error?",
          answer: "Postingan yang dihapus, dilindungi, atau tidak ada videonya tidak bisa didownload.",
        },
      ],
    },
    facebook: {
      slug: "download-video-facebook",
      network: "Facebook",
      title: "Download Video Facebook MP4 | Nowvi",
      description: "Download video dan Reels Facebook dalam format MP4 tanpa login. Gratis sampai 720p.",
      heading: "Download video Facebook",
      subtitle: "Tempel link video atau Reel Facebook dan download tanpa perlu aplikasi.",
      steps: [{ title: "Buka videonya lalu ketuk titik tiga (•••) atau Bagikan." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Bisa download video dari halaman atau grup?",
          answer: "Bisa, asalkan halaman atau grupnya publik.",
        },
        { question: "Apakah link fb.watch bisa?", answer: "Bisa. Nowvi menerima fb.watch dan facebook.com." },
        { question: "Bisa download Reels Facebook?", answer: "Bisa, Reels publik dalam format MP4." },
        {
          question: "Kenapa download kadang gagal?",
          answer: "Video yang dihapus, privat, atau dibatasi tidak tersedia.",
        },
      ],
    },
  },
  pausedLandings: {
    instagram: {
      slug: "download-video-instagram",
      network: "Instagram",
      title: "Download Video Instagram Tanpa Watermark | Nowvi",
      description:
        "Download Reels, Story, dan postingan Instagram dalam format MP4 tanpa instal apa pun. Gratis sampai 720p.",
      heading: "Download video Instagram",
      subtitle:
        "Reels, Story, dan postingan dalam hitungan detik, langsung di browser, tanpa daftar dan tanpa aplikasi.",
      steps: [
        { title: "Buka Reel, Story, atau postingannya lalu ketuk ikon pesawat kertas (Bagikan)." },
        COPY_LINK,
        PASTE_LINK,
      ],
      faq: [
        {
          question: "Apakah Nowvi bisa download Reels, Story, dan postingan?",
          answer: "Bisa. Nowvi mengunduh Reels, Story, dan postingan Instagram publik dalam format MP4.",
        },
        {
          question: "Apakah saya perlu akun Instagram?",
          answer: "Tidak. Cukup link publik videonya, tanpa login ke Instagram maupun Nowvi.",
        },
        {
          question: "Kenapa video dari profil privat tidak bisa?",
          answer:
            "Nowvi hanya mengakses konten publik. Link dari akun privat akan menampilkan pemberitahuan video privat.",
        },
        {
          question: "Videonya dalam format apa?",
          answer: "MP4 dengan audio, yang bisa diputar di HP apa pun dan di WhatsApp.",
        },
      ],
    },
  },
  header: { howItWorks: "Cara kerja", language: "Bahasa" },
  hero: { badge: "Gratis sampai 720p • Tanpa daftar" },
  howItWorks: { eyebrow: "Simpel • Cepat • Langsung", title: "Cara kerja Nowvi" },
  faq: { eyebrow: "Ada pertanyaan?", title: "Pertanyaan Umum" },
  networks: { title: "Download dari platform tertentu", all: "Semua platform" },
  legal: {
    terms: {
      title: "Ketentuan Penggunaan",
      text: "Nowvi adalah alat untuk mengunduh video publik dari TikTok, X, dan Facebook untuk penggunaan pribadi. Gunakan hanya untuk konten milikmu sendiri atau yang kamu punya izin untuk diunduh; mengunggah ulang materi orang lain tanpa izin menjadi tanggung jawab orang yang mengunduhnya. Nowvi tidak menyimpan atau menyebarkan video: setiap unduhan diambil saat itu juga dari sumber publik yang kamu berikan. Nowvi dapat menolak atau menghentikan unduhan kapan saja. Dengan memakai situs ini, kamu menerima ketentuan ini dan hukum Brasil.",
    },
    privacy: {
      title: "Kebijakan Privasi",
      text: "Nowvi tidak meminta pendaftaran, login, atau data pribadi; satu-satunya data yang diproses adalah link video. Tidak ada video yang disimpan. Kami hanya menyimpan metrik agregat (platform dan kualitas yang diunduh), tanpa dikaitkan dengan siapa pun, sesuai LGPD Brasil (Undang-Undang 13.709/2018). Browser hanya menyimpan pilihan cookie kamu, dan iklan hanya dimuat jika kamu setuju; ubah kapan saja lewat “Preferensi cookie” di footer. Untuk mencegah penyalahgunaan, server memakai IP kamu selama beberapa menit, hanya di memori, tanpa disimpan. Pertanyaan soal data: contato@nowvi.com.br.",
    },
    dmca: {
      title: "Penghapusan Konten (DMCA)",
      text: "Nowvi tidak meng-hosting video: file diambil dari sumber publik saat ada yang memintanya, tanpa salinan di server. Pemilik hak atas sebuah video dapat meminta pemblokiran link melalui contato@nowvi.com.br, dengan mengirimkan link dan bukti kepemilikan. Setiap pemberitahuan akan ditinjau dan dapat berujung pada pemblokiran ekstraksi untuk link tersebut. Penghapusan konten asli harus diajukan ke platform asalnya.",
    },
  },
  footer: {
    tagline: "Cara tercepat menyimpan video TikTok, X, dan Facebook ke HP kamu.",
    legalNav: "Tautan legal",
    contact: "Kontak",
    cookiePreferences: "Preferensi cookie",
    disclaimer: "Kami tidak berafiliasi dengan media sosial yang disebutkan.",
  },
  notFound: {
    title: "Halaman tidak ditemukan.",
    text: "Alamat yang kamu buka tidak ada.",
    back: "Kembali ke beranda",
  },
  offers: { free: "Gratis sampai 720p", fullHd: "Full HD 1080p" },
  client: {
    features: { fullHdPix: false },
    errors: {
      invalid_url: "Link ini sepertinya tidak valid. Salin link video lengkapnya, yang diawali https://.",
      unsupported_platform: "Untuk saat ini, Nowvi bisa download video dari TikTok, X, dan Facebook.",
      platform_unavailable:
        "Instagram sedang tidak tersedia untuk sementara. Untuk saat ini, Nowvi bisa download video dari TikTok, X, dan Facebook.",
      too_long: "Video ini lebih dari 15 menit. Untuk saat ini, Nowvi bisa download video sampai 15 menit.",
      not_found:
        "Kami tidak menemukan video ini. Mungkin videonya privat, sudah dihapus, atau postingannya tidak ada video.",
      rate_limited: "Terlalu banyak pencarian dalam waktu singkat. Tunggu beberapa detik lalu coba lagi.",
      extract_failed: "Kami belum bisa membaca video ini. Coba lagi sebentar lagi.",
      busy: "Sedang banyak download saat ini. Coba lagi sebentar lagi.",
      too_early: "Download-nya belum terbuka. Tunggu sampai hitungan mundur selesai.",
      expired: "Link download ini sudah kedaluwarsa. Cari videonya lagi.",
      payments_disabled: "Download berbayar segera hadir. Untuk saat ini, download gratis dalam 720p.",
      invalid_token: "Link download tidak valid. Cari videonya lagi.",
      unknown: "Ada yang salah. Coba lagi sebentar lagi.",
    },
    downloader: {
      label: "Download video",
      newSearch: "Cari lagi",
      ready: "Video siap didownload",
      inputLabel: "Link video",
      placeholder: "Tempel link video di sini",
      paste: "Tempel",
      submit: "Download Sekarang",
      loading: "Mencari video…",
      worksWith: "Bisa untuk",
    },
    quality: {
      title: "Pilih cara download",
      oneOption: "1 pilihan",
      twoOptions: "2 pilihan",
      recommended: "Rekomendasi",
      fullHdText: "Tanpa iklan, kecepatan penuh, dan langsung terbuka.",
      instant: "Download instan",
      sharp: "Ketajaman asli",
      unlockPix: "Buka Full HD",
      free: "Gratis",
      upTo: "sampai {quality}",
      freeText: "Tonton iklan singkat 30 detik dan download tanpa bayar.",
      freeLegend: "Kualitas download gratis",
      freeButton: "Download gratis ({quality})",
    },
    waiting: {
      badge: "Akses gratis",
      titles: {
        waiting: "Menyiapkan download kamu…",
        ready: "Download kamu sudah siap",
        downloading: "Video kamu sedang didownload",
      },
      announcements: { waiting: "", ready: "Download siap", downloading: "Download dimulai" },
      downloadingHint: "Cek folder download di HP atau komputer kamu.",
      readyHint: "Ketuk Download sekarang untuk menyimpan videonya.",
      unlocksIn: "Download kamu terbuka dalam",
      keepOpen: "Tolong biarkan layar ini tetap terbuka.",
      started: "Download sudah dimulai. Kalau tidak terbuka, ketuk Download lagi.",
      newVideo: "Download video lain",
      again: "Download lagi",
      otherQuality: "Download dengan kualitas lain",
      download: "Download sekarang",
      waitingAd: "Menunggu iklan ({seconds}s)…",
      progress: "Progres download",
      skipTitle: "Mau langsung tanpa menunggu?",
      skipText: "Download langsung, tanpa iklan, dan dalam Full HD 1080p.",
      skipButton: "Download dalam Full HD",
      file: "Video {quality} dalam {ext}",
    },
    pix: {
      title: "Full HD 1080p",
      description: "Sekali bayar, tanpa langganan.",
      detail: "Full HD 1080p",
      total: "Total bayar",
      free: "Download Gratis (720p)",
      close: "Tutup",
    },
    ad: {
      label: "Iklan",
      title: "Iklan membuat Nowvi tetap gratis",
      text: "Terima kasih sudah menonton. Setiap iklan membantu kami menjaga download tetap gratis dan tanpa batas.",
      upgrade: "Mau Full HD",
    },
    cookie: {
      label: "Pemberitahuan cookie",
      text: "Kami memakai cookie untuk menampilkan iklan, sesuai aturan perlindungan data.",
      decline: "Tolak",
      accept: "Terima",
    },
    theme: { toggle: "Ganti mode gelap" },
  },
} satisfies Dictionary;
