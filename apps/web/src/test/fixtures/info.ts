// `POST /api/info` bodies as the production API sends them; formats come from the yt-dlp probes
// pinned in `crates/nowvi-api/src/video/ytdlp.rs` (2026-10-30).

const freeWindow = { available_at: 1793330030, wait_seconds: 30, expires_in_seconds: 930 };

export const tiktokInfo = {
  platform: "tiktok",
  title: "Scout the dog at the beach",
  author: "scout2015",
  thumbnail: "https://p16-sign.tiktokcdn.com/obj/scout.jpeg",
  duration_seconds: 12,
  free: { height: 720, filesize_bytes: 2004627, token: "tiktok-720-token", ...freeWindow },
  full_hd_available: false,
  formats: [
    {
      quality: "720p",
      height: 720,
      ext: "mp4",
      filesize_bytes: 2004627,
      tier: "free",
      token: "tiktok-720-token",
      h264: false,
    },
    {
      quality: "576p",
      height: 576,
      ext: "mp4",
      filesize_bytes: 2953029,
      tier: "free",
      token: "tiktok-576-token",
      h264: true,
    },
  ],
};

export const xInfo = {
  platform: "x",
  title: "Falcon Heavy launch",
  author: "SpaceX",
  thumbnail: "https://pbs.twimg.com/ext_tw_video_thumb/falcon.jpg",
  duration_seconds: 140,
  free: { height: 720, filesize_bytes: 31095584, token: "x-720-token", ...freeWindow },
  full_hd_available: true,
  formats: [
    { quality: "1080p", height: 1080, ext: "mp4", filesize_bytes: 148161312, tier: "full_hd", token: null, h264: true },
    {
      quality: "720p",
      height: 720,
      ext: "mp4",
      filesize_bytes: 31095584,
      tier: "free",
      token: "x-720-token",
      h264: true,
    },
    {
      quality: "360p",
      height: 360,
      ext: "mp4",
      filesize_bytes: 11889488,
      tier: "free",
      token: "x-360-token",
      h264: true,
    },
    {
      quality: "270p",
      height: 270,
      ext: "mp4",
      filesize_bytes: 3658304,
      tier: "free",
      token: "x-270-token",
      h264: true,
    },
  ],
};

export const facebookInfo = {
  platform: "facebook",
  title: "Reel",
  author: null,
  thumbnail: "https://scontent.xx.fbcdn.net/reel.jpg",
  duration_seconds: 21,
  free: { height: 0, filesize_bytes: null, token: "facebook-hd-token", ...freeWindow },
  full_hd_available: false,
  formats: [
    {
      quality: "HD",
      height: 0,
      ext: "mp4",
      filesize_bytes: null,
      tier: "free",
      token: "facebook-hd-token",
      h264: true,
    },
    {
      quality: "SD",
      height: 0,
      ext: "mp4",
      filesize_bytes: null,
      tier: "free",
      token: "facebook-sd-token",
      h264: true,
    },
  ],
};

/** The example list in `docs/specs/cards/NOWVI-22-formats.md`, the only one with a 480p row. */
export const contractExampleInfo = {
  ...xInfo,
  free: { height: 720, filesize_bytes: 18400000, token: "example-720-token", ...freeWindow },
  formats: [
    { quality: "1080p", height: 1080, ext: "mp4", filesize_bytes: 41000000, tier: "full_hd", token: null, h264: true },
    {
      quality: "720p",
      height: 720,
      ext: "mp4",
      filesize_bytes: 18400000,
      tier: "free",
      token: "example-720-token",
      h264: true,
    },
    {
      quality: "480p",
      height: 480,
      ext: "mp4",
      filesize_bytes: 9100000,
      tier: "free",
      token: "example-480-token",
      h264: true,
    },
    {
      quality: "360p",
      height: 360,
      ext: "mp4",
      filesize_bytes: null,
      tier: "free",
      token: "example-360-token",
      h264: true,
    },
  ],
};

/** An API from before NOWVI-22, still answering mid deploy: no `formats` and no `h264`. */
export const legacyInfo = {
  platform: "instagram",
  title: "Reel antigo",
  author: "nowvi",
  thumbnail: null,
  duration_seconds: 48,
  free: { height: 720, filesize_bytes: 18400000, token: "legacy-720-token", ...freeWindow },
  full_hd_available: true,
};
