import type { Dictionary } from "./pt-br";

const COPY_LINK = { title: 'Tap "Copy link".' };
const PASTE_LINK = { title: 'Paste the link into Nowvi and tap "Download Now".' };

export const en = {
  home: {
    title: "Nowvi: TikTok, X and Facebook Video Downloader",
    description:
      "Download TikTok, X and Facebook videos without watermark and without sign-up. Free up to 720p, and nothing is stored on our servers.",
    heading: "Download videos from any app, all in one place.",
    highlight: "all in one place.",
    subtitle: "Save TikTok videos, X posts and Facebook videos to your phone in seconds.",
    steps: [
      {
        title: "Copy the video link",
        text: "In TikTok, X or Facebook, tap Share, then Copy link.",
      },
      {
        title: "Paste it into Nowvi and tap Download",
        text: "Use the Paste button or drop the link into the field. Nowvi finds the video in seconds.",
      },
      {
        title: "Pick the quality and save",
        text: "Download for free in up to 720p after a 30-second ad.",
      },
    ],
    faq: [
      {
        question: "Is Nowvi free?",
        answer: "Yes. Downloads up to 720p are free and unlimited, after a 30-second ad.",
      },
      {
        question: "Does it work on iPhone and Android?",
        answer: "Yes. Nowvi runs in the browser on any iPhone, Android phone, tablet or computer. Nothing to install.",
      },
      {
        question: "Does Nowvi store the videos I download?",
        answer: "No. The video is fetched and sent straight to you, and no copy stays on our servers.",
      },
      {
        question: "How do I download a TikTok video without the watermark?",
        answer:
          'Open the video, tap Share, then "Copy link". Paste the link into Nowvi and you get the video without the TikTok logo.',
      },
      {
        question: "Why do some videos have no sound?",
        answer:
          "Usually the licensed music was muted on the original app. When the original has audio, Nowvi downloads the version with audio.",
      },
    ],
  },
  landings: {
    tiktok: {
      slug: "tiktok-video-downloader",
      network: "TikTok",
      title: "TikTok Video Downloader without Watermark | Nowvi",
      description: "Download TikTok videos as MP4 without the watermark and without sign-up. Free up to 720p.",
      heading: "TikTok video downloader without watermark",
      subtitle: "Paste a TikTok link and get a clean video, without the floating logo.",
      steps: [{ title: "Open the video and tap Share (the arrow on the right)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Does Nowvi remove the TikTok watermark?",
          answer: "Yes. The video comes out without the logo and the floating @username.",
        },
        {
          question: "Does the video keep the original audio?",
          answer: "Yes, with the audio in sync, just as it was posted.",
        },
        {
          question: "Does it work on iPhone?",
          answer: "Yes. It works in Safari on iPhone and Chrome on Android, no app needed.",
        },
        { question: "Can I download videos from private accounts?", answer: "No. Only public videos work." },
      ],
    },
    x: {
      slug: "twitter-video-downloader",
      network: "X (Twitter)",
      title: "X (Twitter) Video Downloader in MP4 | Nowvi",
      description: "Download videos from X (formerly Twitter) posts as MP4, no sign-up needed. Free up to 720p.",
      heading: "X (Twitter) video downloader",
      subtitle: "Paste the post link and save the X video to your phone or computer.",
      steps: [{ title: "Open the post and tap the share icon below it." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Can I download the video from any X post?",
          answer: "From public posts, yes. Protected accounts don't work.",
        },
        { question: "Do twitter.com links work?", answer: "Yes. Nowvi accepts both x.com and twitter.com links." },
        { question: "Does the video include audio?", answer: "Yes, whenever the original post has sound." },
        {
          question: "Why do some posts fail?",
          answer: "If the post was deleted, is protected or has no video, there's nothing to download.",
        },
      ],
    },
    facebook: {
      slug: "facebook-video-downloader",
      network: "Facebook",
      title: "Facebook Video Downloader in MP4 | Nowvi",
      description: "Download Facebook videos and Reels as MP4, no login needed. Free up to 720p.",
      heading: "Facebook video downloader",
      subtitle: "Paste the link to a Facebook video or Reel and download it, no app needed.",
      steps: [{ title: "Open the video and tap the three dots (•••) or Share." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Can I download videos from pages and groups?",
          answer: "Yes, as long as the page or group is public.",
        },
        { question: "Do fb.watch links work?", answer: "Yes. Nowvi accepts fb.watch and facebook.com links." },
        { question: "Can I download Facebook Reels?", answer: "Yes, public Reels as MP4." },
        {
          question: "Why does the download fail sometimes?",
          answer: "Deleted, private or restricted videos aren't available.",
        },
      ],
    },
  },
  pausedLandings: {
    instagram: {
      slug: "instagram-video-downloader",
      network: "Instagram",
      title: "Instagram Video Downloader without Watermark | Nowvi",
      description: "Download Instagram Reels, Stories and posts as MP4, nothing to install. Free up to 720p.",
      heading: "Instagram video downloader",
      subtitle: "Reels, Stories and posts in seconds, right in your browser, no sign-up and no app.",
      steps: [{ title: "Open the Reel, Story or post and tap the paper plane (Share)." }, COPY_LINK, PASTE_LINK],
      faq: [
        {
          question: "Does Nowvi download Reels, Stories and posts?",
          answer: "Yes. Nowvi downloads public Instagram Reels, Stories and posts as MP4.",
        },
        {
          question: "Do I need an Instagram account?",
          answer: "No. All you need is the public video link, with no login to Instagram or Nowvi.",
        },
        {
          question: "Why don't videos from private profiles work?",
          answer: "Nowvi only reaches public content. A link from a private account shows the private video notice.",
        },
        {
          question: "What format is the video?",
          answer: "MP4 with audio, which plays on any phone and in WhatsApp.",
        },
      ],
    },
  },
  header: { howItWorks: "How it works", language: "Language" },
  hero: { badge: "Free up to 720p • No sign-up" },
  howItWorks: { eyebrow: "Simple • Fast • Direct", title: "How Nowvi works" },
  faq: { eyebrow: "Got questions?", title: "Frequently Asked Questions" },
  networks: { title: "Download from a specific platform", all: "All platforms" },
  legal: {
    terms: {
      title: "Terms of Use",
      text: "Nowvi is a tool for downloading public TikTok, X and Facebook videos for personal use. Only use it for your own content or content you're allowed to download; reposting someone else's material without permission is the responsibility of whoever downloads it. Nowvi doesn't host or distribute videos: each download is fetched on the spot from the public source you provide. Nowvi may refuse or stop downloads at any time. By using the site you accept these terms and Brazilian law.",
    },
    privacy: {
      title: "Privacy Policy",
      text: "Nowvi asks for no sign-up, login or personal data; the only data processed is the video link. No video is stored. We keep only aggregate metrics (platform and quality downloaded), never tied to a person, in line with Brazil's LGPD (Law 13,709/2018). Your browser stores only your cookie choice, and ads load only if you accept; change it anytime under “Cookie preferences” in the footer. To stop abuse, the server uses your IP for a few minutes, in memory only, never stored. Questions about your data: contato@nowvi.com.br.",
    },
    dmca: {
      title: "Content Removal (DMCA)",
      text: "Nowvi doesn't host videos: the file is fetched from the public source when someone requests it, with no copy kept on the server. Rights holders can ask us to block a link at contato@nowvi.com.br by sending the link and proof of ownership. Every notice is reviewed and may lead to blocking extraction for that link. Removal of the original content must be requested from the platform where it was posted.",
    },
  },
  footer: {
    tagline: "The fastest way to save TikTok, X and Facebook videos to your phone.",
    legalNav: "Legal links",
    contact: "Contact",
    cookiePreferences: "Cookie preferences",
    disclaimer: "We are not affiliated with the social networks mentioned.",
  },
  notFound: {
    title: "Page not found.",
    text: "The address you opened doesn't exist.",
    back: "Back to home",
  },
  offers: { free: "Free up to 720p", fullHd: "Full HD 1080p" },
  llms: { pages: "Pages", languages: "Languages", fullText: "Every FAQ, in every language." },
  client: {
    features: { fullHdPix: false },
    errors: {
      invalid_url: "That link doesn't look valid. Copy the full video link, starting with https://.",
      unsupported_platform: "For now, Nowvi downloads videos from TikTok, X and Facebook.",
      platform_unavailable:
        "Instagram is temporarily unavailable. For now, Nowvi downloads videos from TikTok, X and Facebook.",
      too_long: "This video is longer than 15 minutes. For now, Nowvi downloads videos up to 15 minutes long.",
      not_found: "We couldn't find this video. It may be private or deleted, or the post has no video.",
      rate_limited: "Too many searches in a short time. Wait a few seconds and try again.",
      extract_failed: "We couldn't read this video right now. Try again in a moment.",
      busy: "We're handling a lot of downloads right now. Try again in a moment.",
      too_early: "Your download isn't unlocked yet. Wait for the countdown to finish.",
      expired: "This download link has expired. Search for the video again.",
      payments_disabled: "Paid downloads are coming soon. For now, download for free in 720p.",
      invalid_token: "This download link isn't valid. Search for the video again.",
      unknown: "Something went wrong. Try again in a moment.",
    },
    downloader: {
      label: "Download video",
      newSearch: "New search",
      ready: "Video ready to download",
      inputLabel: "Video link",
      placeholder: "Paste the video link here",
      paste: "Paste",
      submit: "Download Now",
      loading: "Finding video…",
      worksWith: "Works with",
    },
    quality: {
      title: "Choose how to download",
      oneOption: "1 option",
      twoOptions: "2 options",
      recommended: "Recommended",
      fullHdText: "No ads, full speed and unlocked instantly.",
      instant: "Instant download",
      sharp: "Original sharpness",
      unlockPix: "Unlock Full HD",
      free: "Free",
      upTo: "up to {quality}",
      freeText: "Watch a short 30-second ad and download without paying a thing.",
      freeLegend: "Free download quality",
      freeButton: "Download free ({quality})",
    },
    waiting: {
      badge: "Free access",
      titles: {
        waiting: "Unlocking your download…",
        ready: "Your download is ready",
        downloading: "Your video is downloading",
      },
      announcements: { waiting: "", ready: "Download unlocked", downloading: "Download started" },
      downloadingHint: "Check the downloads folder on your phone or computer.",
      readyHint: "Tap Download now to save the video.",
      unlocksIn: "Your download unlocks in",
      keepOpen: "Please keep this screen open.",
      started: "Your download has started. If it doesn't open, tap Download again.",
      newVideo: "Download another video",
      again: "Download again",
      otherQuality: "Download in another quality",
      download: "Download now",
      waitingAd: "Waiting for the ad ({seconds}s)…",
      progress: "Unlock progress",
      skipTitle: "Want to skip the wait?",
      skipText: "Download instantly, ad-free and in Full HD 1080p.",
      skipButton: "Download in Full HD",
      file: "{quality} video in {ext}",
      share: {
        preparing: "Getting it ready to send…",
        send: "Send on WhatsApp",
        prepare: "Get {quality} ready for WhatsApp",
        failed: "Couldn't attach it. Download it and send it",
        shareLink: "Share link",
        linkText: "Download TikTok, X and Facebook videos for free with Nowvi: {url}",
      },
    },
    pix: {
      title: "Full HD 1080p",
      description: "One-time charge, no subscription.",
      detail: "Full HD 1080p",
      total: "Total",
      free: "Download Free (720p)",
      close: "Close",
    },
    ad: {
      label: "Advertisement",
      title: "Ads keep Nowvi free",
      text: "Thanks for watching. Every ad helps us keep downloads free and unlimited.",
      upgrade: "Get Full HD",
    },
    cookie: {
      label: "Cookie notice",
      text: "We use cookies to show ads, in line with data protection law.",
      decline: "Decline",
      accept: "Accept",
    },
    theme: { toggle: "Toggle dark mode" },
  },
} satisfies Dictionary;
