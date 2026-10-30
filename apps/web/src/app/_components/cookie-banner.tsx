"use client";

import { useSyncExternalStore } from "react";

import { CookieIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nowvi-cookie-consent";
const CONSENT_EVENT = "nowvi-consent";

type Consent = "accepted" | "declined";

let memoryConsent: Consent | null = null;

const readConsent = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memoryConsent;
  } catch {
    return memoryConsent;
  }
};

const saveConsent = (value: Consent) => {
  memoryConsent = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode): the choice lasts for this visit only.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
};

/** `undefined` on the server and during hydration, `null` while the visitor has not chosen. */
export const useConsent = () => useSyncExternalStore(subscribe, readConsent, () => undefined);

export const CookieBanner = () => {
  const consent = useConsent();
  if (consent !== null) return null;

  return (
    <>
      <div aria-hidden className="h-44" />
      <section
        aria-label="Aviso de cookies"
        className="bg-foreground text-background fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl p-4 shadow-lg"
      >
        <p className="flex items-start gap-3 text-sm">
          <CookieIcon className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
          Usamos cookies para exibir anúncios, conforme a LGPD.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            className="text-background hover:bg-background/10 hover:text-background h-11 px-4"
            onClick={() => saveConsent("declined")}
          >
            Recusar
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-5 font-bold"
            onClick={() => saveConsent("accepted")}
          >
            Aceitar
          </Button>
        </div>
      </section>
    </>
  );
};
