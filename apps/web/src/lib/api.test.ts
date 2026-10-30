import { delay, HttpResponse, http, type JsonBodyType } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { facebookInfo, legacyInfo, tiktokInfo, xInfo } from "@/test/fixtures/info";
import { apiError, INFO_URL, ORDERS_URL, server } from "@/test/handlers";

import { createOrder, downloadUrl, errorCodeSchema, fetchVideoInfo } from "./api";

const answerInfoWith = (body: JsonBodyType) => server.use(http.post(INFO_URL, () => HttpResponse.json(body)));

const fetchParsedInfo = async () => {
  const result = await fetchVideoInfo("https://x.com/SpaceX/status/1732824684683784516");
  if (!result.ok) throw new Error(`expected a parsed video, got ${result.code}`);
  return result.body;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchVideoInfo", () => {
  it.each([
    ["tiktok", tiktokInfo],
    ["x", xInfo],
    ["facebook", facebookInfo],
  ])("parses the %s response with its formats as sent", async (platform, fixture) => {
    answerInfoWith(fixture);

    const video = await fetchParsedInfo();

    expect(video.platform).toBe(platform);
    expect(video.formats).toEqual(fixture.formats);
    expect(video.free.wait_seconds).toBe(30);
  });

  it("drops a thumbnail that is not https", async () => {
    answerInfoWith({ ...tiktokInfo, thumbnail: "http://p16-sign.tiktokcdn.com/obj/scout.jpeg" });

    const video = await fetchParsedInfo();

    expect(video.thumbnail).toBeNull();
  });

  it("rebuilds the formats from free when the API predates the list", async () => {
    answerInfoWith(legacyInfo);

    const video = await fetchParsedInfo();

    expect(video.formats).toEqual([
      { quality: "1080p", height: 1080, ext: "mp4", filesize_bytes: null, h264: false, tier: "full_hd", token: null },
      {
        quality: "720p",
        height: 720,
        ext: "mp4",
        filesize_bytes: 18400000,
        h264: false,
        tier: "free",
        token: "legacy-720-token",
      },
    ]);
  });

  it("rebuilds only the free format when the old API has no Full HD", async () => {
    answerInfoWith({ ...legacyInfo, full_hd_available: false });

    const video = await fetchParsedInfo();

    expect(video.formats.map((format) => format.tier)).toEqual(["free"]);
  });

  it("rejects a free format that carries no token and falls back to free", async () => {
    const [fullHd, freeWithToken] = xInfo.formats;
    answerInfoWith({ ...xInfo, formats: [fullHd, { ...freeWithToken, token: null }] });

    const video = await fetchParsedInfo();

    expect(video.formats.filter((format) => format.tier === "free")).toEqual([
      {
        quality: "720p",
        height: 720,
        ext: "mp4",
        filesize_bytes: 31095584,
        h264: false,
        tier: "free",
        token: "x-720-token",
      },
    ]);
  });

  it("fails the whole response when free has no token", async () => {
    answerInfoWith({ ...xInfo, free: { ...xInfo.free, token: null } });

    const result = await fetchVideoInfo("https://x.com/SpaceX/status/1");

    expect(result).toEqual({ ok: false, code: "unknown" });
  });

  it.each(errorCodeSchema.options)("returns the %s code from the error body", async (code) => {
    server.use(http.post(INFO_URL, () => apiError(code)));

    const result = await fetchVideoInfo("https://x.com/SpaceX/status/1");

    expect(result).toEqual({ ok: false, code });
  });

  it("ignores any server text next to the code", async () => {
    server.use(
      http.post(INFO_URL, () =>
        HttpResponse.json({ error: "busy", message: "yt-dlp exited with 1: <script>" }, { status: 503 }),
      ),
    );

    const result = await fetchVideoInfo("https://x.com/SpaceX/status/1");

    expect(result).toEqual({ ok: false, code: "busy" });
  });

  it.each([
    ["an unknown code", HttpResponse.json({ error: "teapot" }, { status: 418 })],
    ["an HTML error page", HttpResponse.html("<h1>Bad Gateway</h1>", { status: 502 })],
  ])("turns %s into unknown", async (_label, response) => {
    server.use(http.post(INFO_URL, () => response));

    const result = await fetchVideoInfo("https://x.com/SpaceX/status/1");

    expect(result).toEqual({ ok: false, code: "unknown" });
  });

  it("turns a network error into unknown", async () => {
    server.use(http.post(INFO_URL, () => HttpResponse.error()));

    const result = await fetchVideoInfo("https://x.com/SpaceX/status/1");

    expect(result).toEqual({ ok: false, code: "unknown" });
  });

  it("gives up after 30 seconds and returns unknown", async () => {
    const realTimeout = AbortSignal.timeout.bind(AbortSignal);
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(() => realTimeout(10));
    server.use(
      http.post(INFO_URL, async () => {
        await delay("infinite");
        return HttpResponse.json(xInfo);
      }),
    );

    const result = await fetchVideoInfo("https://x.com/SpaceX/status/1");

    expect(timeout).toHaveBeenCalledWith(30_000);
    expect(result).toEqual({ ok: false, code: "unknown" });
  });

  it("posts only the url as JSON", async () => {
    const sentBodies: unknown[] = [];
    server.use(
      http.post(INFO_URL, async ({ request }) => {
        sentBodies.push({ contentType: request.headers.get("content-type"), body: await request.json() });
        return HttpResponse.json(xInfo);
      }),
    );

    await fetchVideoInfo("https://vm.tiktok.com/ZMabc/");

    expect(sentBodies).toEqual([{ contentType: "application/json", body: { url: "https://vm.tiktok.com/ZMabc/" } }]);
  });
});

describe("createOrder", () => {
  it("returns payments_disabled while the API has no Pix", async () => {
    expect(await createOrder("https://x.com/SpaceX/status/1")).toEqual({ ok: false, code: "payments_disabled" });
  });

  it("returns ok when the API accepts the order", async () => {
    server.use(http.post(ORDERS_URL, () => HttpResponse.json({}, { status: 201 })));

    expect(await createOrder("https://x.com/SpaceX/status/1")).toEqual({ ok: true, body: null });
  });

  it("turns a network error into unknown", async () => {
    server.use(http.post(ORDERS_URL, () => HttpResponse.error()));

    expect(await createOrder("https://x.com/SpaceX/status/1")).toEqual({ ok: false, code: "unknown" });
  });
});

describe("downloadUrl", () => {
  it("points at the API with the token escaped", () => {
    expect(downloadUrl("eyJ1Ijoi+/=.sig")).toBe("https://api.nowvi.test/api/download?token=eyJ1Ijoi%2B%2F%3D.sig");
  });
});
