import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DictionaryProvider } from "@/i18n/client";
import { ptBr } from "@/i18n/dictionaries/pt-br";
import { videoInfoSchema } from "@/lib/api";
import { tiktokInfo, xInfo } from "@/test/fixtures/info";
import { DOWNLOAD_URL, server, VIDEO_BYTES, VIDEO_FILE_NAME, videoResponse } from "@/test/handlers";

import { WaitingPanel } from "./waiting-panel";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/pt-br/baixar-video-x",
}));

const OBJECT_URL = "blob:https://nowvi.test/5f1c";

const recordDownloads = (respond: () => Response | Promise<Response> = videoResponse) => {
  const requestedTokens: (string | null)[] = [];
  server.use(
    http.get(DOWNLOAD_URL, ({ request }) => {
      requestedTokens.push(new URL(request.url).searchParams.get("token"));
      return respond();
    }),
  );
  return requestedTokens;
};

type ShareData = { files?: File[] };

/** A phone browser: Web Share Level 2 for mp4 files and a coarse pointer. */
const stubPhone = ({
  canShare = () => true,
  share = () => Promise.resolve(),
}: {
  canShare?: (shareData: ShareData) => boolean;
  share?: (shareData: ShareData) => Promise<void>;
} = {}) => {
  const shareSpy = vi.fn(share);
  Object.defineProperty(navigator, "canShare", { configurable: true, value: canShare });
  Object.defineProperty(navigator, "share", { configurable: true, value: shareSpy });
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(pointer: coarse)" }));
  vi.spyOn(URL, "createObjectURL").mockReturnValue(OBJECT_URL);
  vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  return shareSpy;
};

const renderPanel = (fixture: unknown, quality: string, phase: "ready" | "waiting" = "ready") => {
  const video = videoInfoSchema.parse(fixture);
  const freeFormat = (wanted: string) => {
    const format = video.formats.find((candidate) => candidate.quality === wanted);
    if (format?.tier !== "free") throw new Error(`no free ${wanted} in the fixture`);
    return format;
  };
  const unlockedAt = phase === "ready" ? Date.now() - 1_000 : Date.now() + 30_000;
  const panel = (wanted: string) => (
    <DictionaryProvider value={ptBr.client}>
      <WaitingPanel
        format={freeFormat(wanted)}
        formats={video.formats}
        startedAt={Date.now() - 1_000}
        readyAt={unlockedAt}
        expiresAt={Date.now() + 900_000}
        onExpired={vi.fn()}
        onNewVideo={vi.fn()}
        onOtherQuality={vi.fn()}
      />
    </DictionaryProvider>
  );
  const { rerender } = render(panel(quality));
  return { choose: (wanted: string) => rerender(panel(wanted)) };
};

const share = ptBr.client.waiting.share;

afterEach(() => {
  Reflect.deleteProperty(navigator, "canShare");
  Reflect.deleteProperty(navigator, "share");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WhatsApp share", () => {
  it("fetches the chosen H.264 video once and saves the same blob from Baixar agora", async () => {
    const requestedTokens = recordDownloads();
    const shareSheet = stubPhone();
    const user = userEvent.setup();
    renderPanel(xInfo, "720p");

    await user.click(await screen.findByRole("button", { name: share.send }));

    const downloadLink = screen.getByRole("link", { name: "Baixar agora" });
    expect(downloadLink).toHaveAttribute("href", OBJECT_URL);
    expect(downloadLink).toHaveAttribute("download", VIDEO_FILE_NAME);
    expect(requestedTokens).toEqual(["x-720-token"]);
    expect(shareSheet).toHaveBeenCalledWith({
      files: [expect.objectContaining({ name: VIDEO_FILE_NAME, size: VIDEO_BYTES.byteLength })],
    });
  });

  it("names the file after the quality when Content-Disposition is not exposed", async () => {
    recordDownloads(() => new HttpResponse(VIDEO_BYTES, { headers: { "content-type": "video/mp4" } }));
    stubPhone();
    renderPanel(xInfo, "360p");

    await screen.findByRole("button", { name: share.send });

    expect(screen.getByRole("link", { name: "Baixar agora" })).toHaveAttribute("download", "nowvi-360p.mp4");
  });

  it("prepares another H.264 quality only after the tap", async () => {
    const requestedTokens = recordDownloads();
    stubPhone();
    const user = userEvent.setup();
    renderPanel(tiktokInfo, "720p");

    const prepare = await screen.findByRole("button", { name: "Preparar 576p para WhatsApp" });
    expect(requestedTokens).toEqual([]);
    await user.click(prepare);

    expect(await screen.findByRole("button", { name: share.send })).toBeEnabled();
    expect(requestedTokens).toEqual(["tiktok-576-token"]);
    expect(screen.getByRole("link", { name: "Baixar agora" })).toHaveAttribute(
      "href",
      "https://api.nowvi.test/api/download?token=tiktok-720-token",
    );
  });

  it("shows a disabled preparing button while the blob is in flight", async () => {
    recordDownloads(async () => {
      await delay("infinite");
      return videoResponse();
    });
    stubPhone();
    const user = userEvent.setup();
    renderPanel(tiktokInfo, "720p");

    await user.click(await screen.findByRole("button", { name: "Preparar 576p para WhatsApp" }));

    expect(screen.getByRole("button", { name: share.preparing })).toBeDisabled();
  });

  it("cancels the prefetch when Baixar agora is tapped while preparing, so one download stays alive", async () => {
    const abortedTokens: (string | null)[] = [];
    const requestedTokens = recordDownloads();
    server.use(
      http.get(DOWNLOAD_URL, async ({ request }) => {
        requestedTokens.push(new URL(request.url).searchParams.get("token"));
        request.signal.addEventListener("abort", () =>
          abortedTokens.push(new URL(request.url).searchParams.get("token")),
        );
        await delay("infinite");
        return videoResponse();
      }),
    );
    stubPhone();
    const user = userEvent.setup();
    renderPanel(xInfo, "720p");

    await screen.findByRole("button", { name: share.preparing });
    await user.click(screen.getByRole("link", { name: "Baixar agora" }));

    expect(await screen.findByRole("button", { name: "Preparar 720p para WhatsApp" })).toBeEnabled();
    expect(requestedTokens).toEqual(["x-720-token"]);
    await vi.waitFor(() => expect(abortedTokens).toEqual(["x-720-token"]));
    expect(screen.getByRole("link", { name: "Baixar de novo" })).toHaveAttribute(
      "href",
      "https://api.nowvi.test/api/download?token=x-720-token",
    );
  });

  it("drops the prepared file when the chosen quality changes", async () => {
    let calls = 0;
    recordDownloads(async () => {
      calls += 1;
      if (calls > 1) await delay("infinite");
      return videoResponse();
    });
    stubPhone();
    const view = renderPanel(xInfo, "720p");
    await screen.findByRole("button", { name: share.send });

    view.choose("360p");
    view.choose("720p");

    expect(await screen.findByRole("button", { name: share.preparing })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Baixar agora" })).toHaveAttribute(
      "href",
      "https://api.nowvi.test/api/download?token=x-720-token",
    );
  });

  it("shares the page link through wa.me on a computer", async () => {
    const requestedTokens = recordDownloads();
    renderPanel(xInfo, "720p");

    const shareLink = await screen.findByRole("link", { name: share.shareLink });

    expect(shareLink).toHaveAttribute(
      "href",
      `https://wa.me/?text=${encodeURIComponent("Baixe vídeos do TikTok, X e Facebook de graça no Nowvi: https://nowvi.test/pt-br/baixar-video-x")}`,
    );
    expect(requestedTokens).toEqual([]);
  });

  it("shows no button while the wait is running", async () => {
    stubPhone();
    renderPanel(xInfo, "720p", "waiting");

    expect(await screen.findByRole("heading", { name: "Liberando seu download…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: share.send })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: share.preparing })).not.toBeInTheDocument();
  });

  it("shows no button when no free format is H.264", async () => {
    stubPhone();
    renderPanel({ ...tiktokInfo, formats: [tiktokInfo.formats[0]] }, "720p");

    await screen.findByRole("heading", { name: "Seu download está liberado" });

    expect(screen.queryByText(/WhatsApp/)).not.toBeInTheDocument();
  });

  it.each([
    [
      "the 303 to ?erro=",
      () => new HttpResponse(null, { status: 303, headers: { location: "https://nowvi.test/?erro=busy" } }),
    ],
    ["a response that is not a video", () => HttpResponse.html("<p>erro</p>")],
    ["a network error", () => HttpResponse.error()],
  ])("falls back to the direct link after %s", async (_label, respond) => {
    recordDownloads(respond);
    stubPhone();
    renderPanel(xInfo, "720p");

    expect(await screen.findByText(share.failed)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar agora" })).toHaveAttribute(
      "href",
      "https://api.nowvi.test/api/download?token=x-720-token",
    );
  });

  it("fails when the browser refuses to share the downloaded file", async () => {
    recordDownloads();
    stubPhone({ canShare: (shareData) => shareData.files?.[0]?.name === "nowvi.mp4" });
    renderPanel(xInfo, "720p");

    expect(await screen.findByText(share.failed)).toBeInTheDocument();
  });

  it("shows the fixed text when the share sheet fails", async () => {
    recordDownloads();
    stubPhone({ share: () => Promise.reject(new DOMException("share failed", "NotAllowedError")) });
    const user = userEvent.setup();
    renderPanel(xInfo, "720p");

    await user.click(await screen.findByRole("button", { name: share.send }));

    expect(await screen.findByText(share.failed)).toBeInTheDocument();
  });

  it("stays silent when the person cancels the share sheet", async () => {
    recordDownloads();
    const shareSheet = stubPhone({ share: () => Promise.reject(new DOMException("cancelled", "AbortError")) });
    const user = userEvent.setup();
    renderPanel(xInfo, "720p");

    await user.click(await screen.findByRole("button", { name: share.send }));

    expect(shareSheet).toHaveBeenCalledOnce();
    expect(screen.queryByText(share.failed)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: share.send })).toBeEnabled();
  });
});
