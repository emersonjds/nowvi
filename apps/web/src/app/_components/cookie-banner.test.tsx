import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ptBr } from "@/i18n/dictionaries/pt-br";

const STORAGE_KEY = "nowvi-cookie-consent";
const cookie = ptBr.client.cookie;

/** Fresh modules per test: the consent also lives in memory for when storage is blocked. */
const renderConsentSurfaces = async ({ onUpgrade }: { onUpgrade?: () => void } = {}) => {
  const { DictionaryProvider } = await import("@/i18n/client");
  const { CookieBanner } = await import("./cookie-banner");
  const { AdSlot } = await import("./ad-slot");
  const { SiteFooter } = await import("./site-footer");
  render(
    <DictionaryProvider value={ptBr.client}>
      <AdSlot onUpgrade={onUpgrade} />
      <SiteFooter locale="pt-br" />
      <CookieBanner />
    </DictionaryProvider>,
  );
};

const thirdPartyAd = () => screen.queryByTitle("Publicidade");
const banner = () => screen.queryByRole("region", { name: cookie.label });

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CookieBanner", () => {
  it("asks for consent and keeps the third-party ad off until then", async () => {
    await renderConsentSurfaces();

    expect(banner()).toBeInTheDocument();
    expect(thirdPartyAd()).not.toBeInTheDocument();
    expect(screen.getByText(ptBr.client.ad.title)).toBeInTheDocument();
  });

  it("loads the third-party ad after accepting", async () => {
    const user = userEvent.setup();
    await renderConsentSurfaces();

    await user.click(screen.getByRole("button", { name: cookie.accept }));

    expect(banner()).not.toBeInTheDocument();
    expect(thirdPartyAd()).toHaveAttribute("srcdoc", expect.stringContaining("adsterra-test-key/invoke.js"));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("accepted");
  });

  it("keeps the ad off after declining", async () => {
    const user = userEvent.setup();
    await renderConsentSurfaces();

    await user.click(screen.getByRole("button", { name: cookie.decline }));

    expect(banner()).not.toBeInTheDocument();
    expect(thirdPartyAd()).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("declined");
  });

  it("brings the banner back and stops the ad when consent is revoked from the footer", async () => {
    const user = userEvent.setup();
    await renderConsentSurfaces();

    await user.click(screen.getByRole("button", { name: cookie.accept }));
    await user.click(screen.getByRole("button", { name: ptBr.footer.cookiePreferences }));

    expect(banner()).toBeInTheDocument();
    expect(thirdPartyAd()).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("remembers the choice for the visit when storage is blocked", async () => {
    const blocked = () => {
      throw new DOMException("storage blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);
    const user = userEvent.setup();
    await renderConsentSurfaces();

    await user.click(screen.getByRole("button", { name: cookie.accept }));
    expect(thirdPartyAd()).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: ptBr.footer.cookiePreferences }));

    expect(banner()).toBeInTheDocument();
  });
});

describe("AdSlot", () => {
  it("offers the Full HD upgrade in the placeholder", async () => {
    const onUpgrade = vi.fn();
    const user = userEvent.setup();
    await renderConsentSurfaces({ onUpgrade });

    await user.click(screen.getByRole("button", { name: ptBr.client.ad.upgrade }));

    expect(onUpgrade).toHaveBeenCalledOnce();
  });
});
