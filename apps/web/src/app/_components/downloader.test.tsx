import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ptBr } from "@/i18n/dictionaries/pt-br";
import { contractExampleInfo, xInfo } from "@/test/fixtures/info";
import { apiError, INFO_URL, ORDERS_URL, server } from "@/test/handlers";
import { renderPage } from "@/test/render-page";

const errors = ptBr.client.errors;

const recordInfoRequests = (fixture: unknown) => {
  const sentBodies: unknown[] = [];
  server.use(
    http.post(INFO_URL, async ({ request }) => {
      sentBodies.push(await request.json());
      return HttpResponse.json(fixture);
    }),
  );
  return sentBodies;
};

const recordOrderRequests = () => {
  const sentBodies: unknown[] = [];
  server.use(
    http.post(ORDERS_URL, async ({ request }) => {
      sentBodies.push(await request.json());
      return apiError("payments_disabled");
    }),
  );
  return sentBodies;
};

const searchVideo = async (user: ReturnType<typeof userEvent.setup>, link: string) => {
  await user.type(screen.getByLabelText("Link do vídeo"), link);
  await user.click(screen.getByRole("button", { name: "Baixar Agora" }));
};

// jsdom cannot navigate; the download anchors only need their click handlers to run.
const preventNavigation = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest("a[download]")) event.preventDefault();
};

beforeEach(() => {
  document.addEventListener("click", preventNavigation);
});

afterEach(() => {
  document.removeEventListener("click", preventNavigation);
  window.history.replaceState(null, "", "/");
  vi.useRealTimers();
});

describe("Downloader", () => {
  it("adds https:// to a pasted link without a scheme and lists the free qualities", async () => {
    const sentBodies = recordInfoRequests(contractExampleInfo);
    const user = userEvent.setup();
    renderPage();

    await searchVideo(user, "x.com/SpaceX/status/1732824684683784516");

    const qualities = await screen.findByRole("group", { name: "Qualidade do download grátis" });
    expect(sentBodies).toEqual([{ url: "https://x.com/SpaceX/status/1732824684683784516" }]);
    expect(
      within(qualities)
        .getAllByRole("radio")
        .map((radio) => radio.nextElementSibling?.textContent),
    ).toEqual(["720p HD", "480p", "360p"]);
    expect(within(qualities).getByRole("radio", { name: /720p HD/ })).toBeChecked();
  });

  it("counts the wait from wait_seconds and unlocks the token of the chosen quality", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    recordInfoRequests({ ...contractExampleInfo, free: { ...contractExampleInfo.free, wait_seconds: 5 } });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await searchVideo(user, "https://x.com/SpaceX/status/1");
    await user.click(await screen.findByRole("radio", { name: /480p/ }));
    await user.click(screen.getByRole("button", { name: "Baixar grátis (480p)" }));

    expect(screen.getByRole("button", { name: "Aguardando anúncio (6s)…" })).toBeDisabled();
    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(screen.getByRole("button", { name: "Aguardando anúncio (3s)…" })).toBeDisabled();
    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(screen.getByRole("heading", { name: "Seu download está liberado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar agora" })).toHaveAttribute(
      "href",
      "https://api.nowvi.test/api/download?token=example-480-token",
    );
  });

  it("goes back to the quality list without a new /api/info", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const sentBodies = recordInfoRequests(contractExampleInfo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await searchVideo(user, "https://x.com/SpaceX/status/1");
    await user.click(await screen.findByRole("radio", { name: /360p/ }));
    await user.click(screen.getByRole("button", { name: "Baixar grátis (360p)" }));
    await act(() => vi.advanceTimersByTimeAsync(31_000));
    await user.click(screen.getByRole("link", { name: "Baixar agora" }));
    await user.click(screen.getByRole("button", { name: "Baixar em outra qualidade" }));

    expect(screen.getByRole("radio", { name: /360p/ })).toBeChecked();
    expect(sentBodies).toHaveLength(1);
  });

  it("shows the fixed text for ?erro= and clears the query", async () => {
    window.history.replaceState(null, "", "/pt-br?erro=too_early");

    renderPage();

    expect(await screen.findByText(errors.too_early)).toBeInTheDocument();
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/pt-br");
  });

  it("ignores an ?erro= code outside the contract", async () => {
    window.history.replaceState(null, "", "/pt-br?erro=%3Cscript%3E");

    renderPage();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("explains that Instagram is paused", async () => {
    server.use(http.post(INFO_URL, () => apiError("platform_unavailable")));
    const user = userEvent.setup();
    renderPage();

    await searchVideo(user, "https://www.instagram.com/reel/C1a2b3/");

    expect(await screen.findByRole("alert")).toHaveTextContent(errors.platform_unavailable);
    expect(screen.getByLabelText("Link do vídeo")).toHaveFocus();
  });

  it("shows coming soon in the Pix sheet and orders once per token", async () => {
    const sentOrders = recordOrderRequests();
    recordInfoRequests(xInfo);
    const user = userEvent.setup();
    renderPage();

    await searchVideo(user, "https://x.com/SpaceX/status/1");
    await user.click(await screen.findByRole("button", { name: "Liberar Full HD com Pix" }));
    expect(await screen.findByText(errors.payments_disabled)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: "Quero o Full HD" }));

    expect(await screen.findByText(errors.payments_disabled)).toBeInTheDocument();
    expect(sentOrders).toEqual([{ url: "https://x.com/SpaceX/status/1" }]);
  });

  it("starts the free wait from the Pix sheet", async () => {
    recordInfoRequests(xInfo);
    const user = userEvent.setup();
    renderPage();

    await searchVideo(user, "https://x.com/SpaceX/status/1");
    await user.click(await screen.findByRole("button", { name: "Liberar Full HD com Pix" }));
    await user.click(await screen.findByRole("button", { name: "Baixar Grátis (720p)" }));

    expect(screen.getByRole("heading", { name: "Liberando seu download…" })).toBeInTheDocument();
  });

  it("hides Full HD in English", async () => {
    recordInfoRequests(xInfo);
    const user = userEvent.setup();
    renderPage("en");

    await user.type(screen.getByLabelText("Video link"), "https://x.com/SpaceX/status/1");
    await user.click(screen.getByRole("button", { name: "Download Now" }));

    expect(await screen.findByRole("group", { name: "Free download quality" })).toBeInTheDocument();
    expect(screen.queryByText(/Full HD/)).not.toBeInTheDocument();
  });

  it("starts over from a new search", async () => {
    recordInfoRequests(xInfo);
    const user = userEvent.setup();
    renderPage();

    await searchVideo(user, "https://x.com/SpaceX/status/1");
    await user.click(await screen.findByRole("button", { name: "Nova busca" }));

    expect(screen.getByLabelText("Link do vídeo")).toHaveValue("");
    expect(screen.getByLabelText("Link do vídeo")).toHaveFocus();
  });
});
