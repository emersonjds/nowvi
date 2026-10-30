import type { FreeFormat, VideoFormat } from "./api";

export const MAX_SHARE_BYTES = 50 * 1024 * 1024;

const isShareable = (format: VideoFormat): format is FreeFormat =>
  format.tier === "free" && format.h264 && (format.filesize_bytes ?? 0) <= MAX_SHARE_BYTES;

/** The chosen format when WhatsApp plays it, else the tallest free H.264 one, else `null`. */
export const pickShareableFormat = (formats: readonly VideoFormat[], chosen: FreeFormat): FreeFormat | null => {
  if (isShareable(chosen)) return chosen;
  const shareable = formats.filter(isShareable);
  if (shareable.length === 0) return null;
  return shareable.reduce((tallest, format) => (format.height > tallest.height ? format : tallest));
};

export const fileNameFrom = (contentDisposition: string | null) =>
  contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? null;

const byteCap = (maxBytes: number) => {
  let receivedBytes = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform: (chunk, controller) => {
      receivedBytes += chunk.byteLength;
      if (receivedBytes > maxBytes) controller.error(new Error("video over the share limit"));
      else controller.enqueue(chunk);
    },
  });
};

/**
 * Downloads the video into memory, giving up past `maxBytes` even when the size is unknown.
 * `fileName` is `null` when the API does not expose `Content-Disposition` to CORS.
 */
export const fetchVideoBlob = async (url: string, { maxBytes, signal }: { maxBytes: number; signal: AbortSignal }) => {
  // A failed download answers 303 to the page's `?erro=`: following it would bring back HTML.
  const response = await fetch(url, { signal, redirect: "error" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.startsWith("video/") || !response.body) throw new Error("not a video");
  const capped = response.body.pipeThrough(byteCap(maxBytes));
  return {
    blob: await new Response(capped, { headers: { "content-type": contentType } }).blob(),
    fileName: fileNameFrom(response.headers.get("content-disposition")),
  };
};

export const canShareFiles = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [new File([], "nowvi.mp4", { type: "video/mp4" })] });

export const whatsAppLinkUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
