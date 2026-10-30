"use client";

import { type MouseEvent, useEffect, useState } from "react";

import { ArrowRightIcon, DownloadIcon, FilmIcon, LockIcon, ZapIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { downloadUrl, type VideoInfo } from "@/lib/api";

import { AdSlot } from "./ad-slot";

const formatMegabytes = (bytes: number) =>
  `~${(bytes / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;

type WaitingPanelProps = {
  video: VideoInfo;
  startedAt: number;
  readyAt: number;
  expiresAt: number;
  onFullHd?: () => void;
  onExpired: () => void;
};

export const WaitingPanel = ({ video, startedAt, readyAt, expiresAt, onFullHd, onExpired }: WaitingPanelProps) => {
  const [now, setNow] = useState(startedAt);
  const remainingMs = Math.max(0, readyAt - now);
  const done = remainingMs === 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = 100 - (remainingMs / Math.max(1, readyAt - startedAt)) * 100;

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [done]);

  const handleDownload = (event: MouseEvent<HTMLAnchorElement>) => {
    if (Date.now() <= expiresAt) return;
    event.preventDefault();
    onExpired();
  };

  return (
    <section aria-labelledby="espera-titulo" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Badge className="bg-accent text-accent-foreground h-7 px-3 font-bold tracking-wider uppercase">
          <ZapIcon aria-hidden />
          Acesso gratuito
        </Badge>
        <h2 id="espera-titulo" tabIndex={-1} className="text-[26px] leading-8 font-bold tracking-tight outline-none">
          {done ? "Seu download está liberado" : "Liberando seu download…"}
        </h2>
        <p className="text-muted-foreground">
          {done ? (
            "Toque em Baixar agora para salvar o vídeo."
          ) : (
            <>
              Seu download libera em <strong className="text-primary">{seconds}s</strong>. Por favor, mantenha esta tela
              aberta.
            </>
          )}
        </p>
        <p className="sr-only" aria-live="polite">
          {done ? "Download liberado" : ""}
        </p>
      </div>

      <AdSlot onUpgrade={onFullHd} />

      <div className="flex flex-col gap-2">
        {done ? (
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold">
            <a href={downloadUrl(video.free.token)} download onClick={handleDownload}>
              <DownloadIcon className="size-5" aria-hidden />
              Baixar agora
            </a>
          </Button>
        ) : (
          <Button disabled variant="secondary" className="h-12 text-base font-bold">
            <LockIcon className="size-5" aria-hidden />
            Aguardando anúncio ({seconds}s)…
          </Button>
        )}
        <Progress value={progress} aria-label="Progresso da liberação" className="[&>*]:bg-accent h-1.5" />
      </div>

      {onFullHd ? (
        <article className="bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
              <ZapIcon className="size-5" aria-hidden />
            </span>
            <h3 className="text-lg font-bold">Quer pular a espera?</h3>
          </div>
          <p className="text-muted-foreground text-sm">Baixe na hora, sem anúncio e em Full HD 1080p.</p>
          <Button
            variant="secondary"
            className="text-primary h-auto min-h-12 justify-between px-4 py-2 text-left font-bold whitespace-normal"
            onClick={onFullHd}
          >
            Baixar em Full HD por R$ 2,00 no Pix
            <ArrowRightIcon className="size-5" aria-hidden />
          </Button>
        </article>
      ) : null}

      <p className="bg-muted flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
        <FilmIcon className="text-primary size-5" aria-hidden />
        <span className="flex-1">Vídeo {video.free.height}p em MP4</span>
        {video.free.filesize_bytes ? (
          <span className="text-muted-foreground">{formatMegabytes(video.free.filesize_bytes)}</span>
        ) : null}
      </p>
    </section>
  );
};
