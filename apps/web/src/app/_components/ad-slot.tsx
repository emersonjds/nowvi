"use client";

import { ZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useConsent } from "./cookie-banner";

const ADSTERRA_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY;

const adDocument = (key: string) =>
  `<!doctype html><html><body style="margin:0"><script>atOptions={key:${JSON.stringify(key)},format:"iframe",height:250,width:300,params:{}};</script><script src="https://www.highperformanceformat.com/${encodeURIComponent(key)}/invoke.js"></script></body></html>`;

type AdSlotProps = { onUpgrade?: () => void };

export const AdSlot = ({ onUpgrade }: AdSlotProps) => {
  const consent = useConsent();

  return (
    <aside aria-label="Publicidade" className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">Publicidade</p>
      <div className="bg-muted flex min-h-[250px] items-center justify-center overflow-hidden rounded-2xl">
        {ADSTERRA_KEY && consent === "accepted" ? (
          <iframe
            title="Publicidade"
            width={300}
            height={250}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            srcDoc={adDocument(ADSTERRA_KEY)}
            className="block border-0"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-xl">
              <ZapIcon className="size-6" aria-hidden />
            </span>
            <p className="text-lg font-bold">Full HD 1080p sem anúncio</p>
            <p className="text-muted-foreground max-w-xs text-sm">
              Por R$ 2,00 no Pix o download sai na hora, sem espera e na melhor qualidade.
            </p>
            {onUpgrade ? (
              <Button variant="link" className="h-11 font-semibold" onClick={onUpgrade}>
                Quero o Full HD
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
};
