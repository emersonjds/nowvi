import Script from "next/script";

import { ZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const ADSTERRA_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY;

type AdSlotProps = { onUpgrade?: () => void };

export const AdSlot = ({ onUpgrade }: AdSlotProps) => (
  <aside aria-label="Publicidade" className="flex flex-col gap-1.5">
    <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">Publicidade</p>
    <div className="bg-muted flex min-h-[250px] items-center justify-center overflow-hidden rounded-2xl">
      {ADSTERRA_KEY ? (
        <div id="nowvi-ad" className="flex min-h-[250px] w-[300px] items-center justify-center">
          <Script id="adsterra-options" strategy="lazyOnload">
            {`window.atOptions = { key: ${JSON.stringify(ADSTERRA_KEY)}, format: "iframe", height: 250, width: 300, params: {} };`}
          </Script>
          <Script
            id="adsterra-invoke"
            strategy="lazyOnload"
            src={`https://www.highperformanceformat.com/${encodeURIComponent(ADSTERRA_KEY)}/invoke.js`}
          />
        </div>
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
