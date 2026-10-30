"use client";

import { useEffect, useState } from "react";

import { CookieIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nowvi-cookie-consent";

const readConsent = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveConsent = (value: "accepted" | "declined") => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode): the choice lasts for this visit only.
  }
};

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (value: "accepted" | "declined") => {
    saveConsent(value);
    setVisible(false);
  };

  return (
    <section
      aria-label="Aviso de cookies"
      className="bg-foreground text-background fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl p-4 shadow-lg"
    >
      <p className="flex items-start gap-3 text-sm">
        <CookieIcon className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        Usamos cookies para melhorar sua experiência e medir o tráfego, conforme a LGPD.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          className="text-background hover:bg-background/10 hover:text-background h-11 px-4"
          onClick={() => choose("declined")}
        >
          Recusar
        </Button>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-5 font-bold"
          onClick={() => choose("accepted")}
        >
          Aceitar
        </Button>
      </div>
    </section>
  );
};
