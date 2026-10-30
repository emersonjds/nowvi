import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { contractExampleInfo, facebookInfo, tiktokInfo, xInfo } from "@/test/fixtures/info";
import { DOWNLOAD_URL, server, VIDEO_BYTES, VIDEO_FILE_NAME } from "@/test/handlers";

import { type FreeFormat, type VideoFormat, videoInfoSchema } from "./api";
import { canShareFiles, fetchVideoBlob, MAX_SHARE_BYTES, pickShareableFormat, whatsAppLinkUrl } from "./share-video";

const formatsOf = (fixture: unknown) => videoInfoSchema.parse(fixture).formats;

const freeFormat = (formats: readonly VideoFormat[], quality: string): FreeFormat => {
  const format = formats.find((candidate) => candidate.quality === quality);
  if (format?.tier !== "free") throw new Error(`no free ${quality} in the fixture`);
  return format;
};

const TOKEN_URL = `${DOWNLOAD_URL}?token=x-720-token`;

const fetchWithinShareLimit = (url = TOKEN_URL, signal = new AbortController().signal) =>
  fetchVideoBlob(url, { maxBytes: MAX_SHARE_BYTES, signal });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pickShareableFormat", () => {
  it("keeps the chosen format when it is H.264 under 50 MB", () => {
    const formats = formatsOf(xInfo);

    expect(pickShareableFormat(formats, freeFormat(formats, "360p"))?.token).toBe("x-360-token");
  });

  it("keeps a chosen H.264 format whose size is unknown", () => {
    const formats = formatsOf(facebookInfo);

    expect(pickShareableFormat(formats, freeFormat(formats, "SD"))?.token).toBe("facebook-sd-token");
  });

  it("offers the tallest free H.264 format when the chosen one is not H.264", () => {
    const formats = formatsOf(tiktokInfo);

    expect(pickShareableFormat(formats, freeFormat(formats, "720p"))?.token).toBe("tiktok-576-token");
  });

  it("picks the tallest of several H.264 alternatives", () => {
    const formats = formatsOf(contractExampleInfo).map((format) =>
      format.quality === "720p" ? { ...format, h264: false } : format,
    );

    expect(pickShareableFormat(formats, freeFormat(formats, "720p"))?.token).toBe("example-480-token");
  });

  it("offers nothing when no free format is H.264", () => {
    const formats = formatsOf(tiktokInfo).filter((format) => format.quality === "720p");

    expect(pickShareableFormat(formats, freeFormat(formats, "720p"))).toBeNull();
  });

  it("offers nothing when every H.264 format passes 50 MB", () => {
    const formats = formatsOf(xInfo).map((format) => ({ ...format, filesize_bytes: MAX_SHARE_BYTES + 1 }));

    expect(pickShareableFormat(formats, freeFormat(formats, "720p"))).toBeNull();
  });
});

describe("fetchVideoBlob", () => {
  it("returns the video bytes and the file name from Content-Disposition", async () => {
    const { blob, fileName } = await fetchWithinShareLimit();

    expect(fileName).toBe(VIDEO_FILE_NAME);
    expect(blob.type).toBe("video/mp4");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(VIDEO_BYTES);
  });

  it("returns a null file name when Content-Disposition is not exposed", async () => {
    server.use(
      http.get(DOWNLOAD_URL, () => new HttpResponse(VIDEO_BYTES, { headers: { "content-type": "video/mp4" } })),
    );

    const { fileName } = await fetchWithinShareLimit();

    expect(fileName).toBeNull();
  });

  it("rejects a response that is not a video", async () => {
    server.use(http.get(DOWNLOAD_URL, () => HttpResponse.html("<p>erro</p>")));

    await expect(fetchWithinShareLimit()).rejects.toThrow("not a video");
  });

  it("rejects the 303 to the error page instead of following it", async () => {
    const errorPage = "https://nowvi.test/?erro=expired";
    server.use(
      http.get(DOWNLOAD_URL, () => new HttpResponse(null, { status: 303, headers: { location: errorPage } })),
      http.get(
        "https://nowvi.test/",
        () => new HttpResponse(VIDEO_BYTES, { headers: { "content-type": "video/mp4" } }),
      ),
    );

    await expect(fetchWithinShareLimit()).rejects.toThrow();
  });

  it("stops past 50 MB counted on the stream when the size is unknown", async () => {
    const megabyte = new Uint8Array(1024 * 1024);
    let sentChunks = 0;
    const endlessVideo = new ReadableStream<Uint8Array>({
      pull: (controller) => {
        sentChunks += 1;
        controller.enqueue(megabyte);
        if (sentChunks === 100) controller.close();
      },
    });
    server.use(
      http.get(DOWNLOAD_URL, () => new HttpResponse(endlessVideo, { headers: { "content-type": "video/mp4" } })),
    );

    await expect(fetchWithinShareLimit()).rejects.toThrow("video over the share limit");
    expect(sentChunks).toBeLessThan(100);
  });

  it("rejects with AbortError when the signal aborts", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(fetchWithinShareLimit(TOKEN_URL, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("canShareFiles", () => {
  it("is false without the Web Share API", () => {
    vi.stubGlobal("navigator", {});

    expect(canShareFiles()).toBe(false);
  });

  it("asks the browser whether it shares an mp4 file", () => {
    const canShare = vi.fn(() => true);
    vi.stubGlobal("navigator", { canShare });

    expect(canShareFiles()).toBe(true);
    expect(canShare).toHaveBeenCalledWith({
      files: [expect.objectContaining({ name: "nowvi.mp4", type: "video/mp4" })],
    });
  });
});

describe("whatsAppLinkUrl", () => {
  it("opens wa.me with the text escaped", () => {
    expect(whatsAppLinkUrl("Baixe no Nowvi: https://nowvi.com.br/pt-br?a=1&b=2")).toBe(
      "https://wa.me/?text=Baixe%20no%20Nowvi%3A%20https%3A%2F%2Fnowvi.com.br%2Fpt-br%3Fa%3D1%26b%3D2",
    );
  });
});
