import { z } from "zod";

// The CSP has no 'unsafe-eval'; without this zod probes `new Function` and trips a violation.
z.config({ jitless: true });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const platformSchema = z.enum(["instagram", "tiktok", "x", "facebook"]);

const formatBase = { quality: z.string(), height: z.number(), ext: z.string(), filesize_bytes: z.number().nullable() };

const formatSchema = z.discriminatedUnion("tier", [
  z.object({ ...formatBase, tier: z.literal("free"), token: z.string() }),
  z.object({ ...formatBase, tier: z.literal("full_hd"), token: z.null() }),
]);

export type VideoFormat = z.infer<typeof formatSchema>;
export type FreeFormat = Extract<VideoFormat, { tier: "free" }>;

export const videoInfoSchema = z
  .object({
    platform: platformSchema,
    title: z.string(),
    author: z.string().nullable(),
    thumbnail: z
      .url({ protocol: /^https$/ })
      .nullable()
      .catch(null),
    duration_seconds: z.number().nullable(),
    free: z.object({
      height: z.number(),
      filesize_bytes: z.number().nullable(),
      token: z.string(),
      wait_seconds: z.number(),
      expires_in_seconds: z.number(),
    }),
    full_hd_available: z.boolean(),
    formats: z.array(formatSchema).catch([]),
  })
  .transform((video) => {
    if (video.formats.some((format) => format.tier === "free")) return video;
    // An API from before NOWVI-22 sends no `formats` mid deploy: rebuild the list from `free`.
    const { height, filesize_bytes, token } = video.free;
    const formats: VideoFormat[] = [{ quality: `${height}p`, height, ext: "mp4", filesize_bytes, tier: "free", token }];
    if (video.full_hd_available) {
      formats.unshift({
        quality: "1080p",
        height: 1080,
        ext: "mp4",
        filesize_bytes: null,
        tier: "full_hd",
        token: null,
      });
    }
    return { ...video, formats };
  });

export type Platform = z.infer<typeof platformSchema>;
export type VideoInfo = z.infer<typeof videoInfoSchema>;

export const errorCodeSchema = z.enum([
  "invalid_url",
  "unsupported_platform",
  "platform_unavailable",
  "too_long",
  "not_found",
  "rate_limited",
  "extract_failed",
  "busy",
  "too_early",
  "expired",
  "payments_disabled",
  "invalid_token",
]);

export type ErrorCode = z.infer<typeof errorCodeSchema> | "unknown";

const errorBodySchema = z.object({ error: errorCodeSchema });

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
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
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: ErrorCode };

const readErrorCode = async (response: Response): Promise<ErrorCode> => {
  const body: unknown = await response.json().catch(() => null);
  const parsed = errorBodySchema.safeParse(body);
  return parsed.success ? parsed.data.error : "unknown";
};

const postJson = async (path: string, body: unknown): Promise<Response | null> => {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return null;
  }
};

export const fetchVideoInfo = async (url: string): Promise<ApiResult<VideoInfo>> => {
  const response = await postJson("/api/info", { url });
  if (!response) return { ok: false, code: "unknown" };
  if (!response.ok) return { ok: false, code: await readErrorCode(response) };

  const parsed = videoInfoSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, code: "unknown" };
};

// ponytail: the orders contract lands with NOWVI-2; v0 only answers 503 payments_disabled.
export const createOrder = async (url: string): Promise<ApiResult<null>> => {
  const response = await postJson("/api/orders", { url });
  if (!response) return { ok: false, code: "unknown" };
  if (!response.ok) return { ok: false, code: await readErrorCode(response) };
  return { ok: true, data: null };
};

export const downloadUrl = (token: string) => `${API_URL}/api/download?token=${encodeURIComponent(token)}`;
