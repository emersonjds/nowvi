"use client";

import { type MouseEvent, useEffect, useState } from "react";

import {
  ArrowRightIcon,
  CircleCheckIcon,
  DownloadIcon,
  FilmIcon,
  Layers2Icon,
  LockIcon,
  RotateCcwIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fill, useDictionary } from "@/i18n/client";
import { downloadUrl, type FreeFormat, type VideoFormat } from "@/lib/api";

import { AdSlot } from "./ad-slot";
import { formatMegabytes, qualityLabel } from "./quality-options";
import { useWhatsAppShare, WhatsAppShareButton } from "./whatsapp-share";

const phaseOf = (downloading: boolean, unlocked: boolean) => {
  if (downloading) return "downloading";
  if (unlocked) return "ready";
  return "waiting";
};

type WaitingPanelProps = {
  format: FreeFormat;
  formats: readonly VideoFormat[];
  startedAt: number;
  readyAt: number;
  expiresAt: number;
  onFullHd?: () => void;
  onExpired: () => void;
  onNewVideo: () => void;
  onOtherQuality: () => void;
};

export const WaitingPanel = ({
  format,
  formats,
  startedAt,
  readyAt,
  expiresAt,
  onFullHd,
  onExpired,
  onNewVideo,
  onOtherQuality,
}: WaitingPanelProps) => {
  const copy = useDictionary().waiting;
  const [now, setNow] = useState(startedAt);
  const [downloading, setDownloading] = useState(false);
  const remainingMilliseconds = Math.max(0, readyAt - now);
  const unlocked = remainingMilliseconds === 0;
  const phase = phaseOf(downloading, unlocked);
  const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
  const progress = 100 - (remainingMilliseconds / Math.max(1, readyAt - startedAt)) * 100;
  const whatsApp = useWhatsAppShare({ formats, chosen: format, active: phase !== "waiting" });
  const savedVideo = whatsApp.savedVideo;
  const downloadHref = savedVideo?.href ?? downloadUrl(format.token);
  const downloadName = savedVideo?.fileName ?? "";

  useEffect(() => {
    if (unlocked) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [unlocked]);

  const handleDownload = (event: MouseEvent<HTMLAnchorElement>) => {
    if (savedVideo || Date.now() <= expiresAt) {
      setDownloading(true);
      return;
    }
    event.preventDefault();
    onExpired();
  };

  return (
    <section aria-labelledby="espera-titulo" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Badge className="bg-accent text-accent-foreground h-7 px-3 font-bold tracking-wider uppercase">
          <ZapIcon aria-hidden />
          {copy.badge}
        </Badge>
        <h2 id="espera-titulo" tabIndex={-1} className="text-[26px] leading-8 font-bold tracking-tight outline-none">
          {copy.titles[phase]}
        </h2>
        <p className="text-muted-foreground">
          {phase === "downloading" && copy.downloadingHint}
          {phase === "ready" && copy.readyHint}
          {phase === "waiting" && (
            <>
              {copy.unlocksIn} <strong className="text-primary">{remainingSeconds}s</strong>. {copy.keepOpen}
            </>
          )}
        </p>
        <p className="sr-only" aria-live="polite">
          {copy.announcements[phase]}
        </p>
      </div>

      <AdSlot onUpgrade={onFullHd} />

      <div className="flex flex-col gap-2">
        {phase === "downloading" && (
          <>
            <p className="bg-muted flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium">
              <CircleCheckIcon className="text-primary size-5" aria-hidden />
              {copy.started}
            </p>
            <Button className="h-12 text-base font-bold" onClick={onNewVideo}>
              <RotateCcwIcon className="size-5" aria-hidden />
              {copy.newVideo}
            </Button>
            <Button asChild variant="secondary" className="h-12 text-base font-bold">
              <a href={downloadHref} download={downloadName} onClick={handleDownload}>
                <DownloadIcon className="size-5" aria-hidden />
                {copy.again}
              </a>
            </Button>
            <Button variant="ghost" className="h-12 text-base font-bold" onClick={onOtherQuality}>
              <Layers2Icon className="size-5" aria-hidden />
              {copy.otherQuality}
            </Button>
            <WhatsAppShareButton whatsApp={whatsApp} />
          </>
        )}
        {phase === "ready" && (
          <>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold">
              <a href={downloadHref} download={downloadName} onClick={handleDownload}>
                <DownloadIcon className="size-5" aria-hidden />
                {copy.download}
              </a>
            </Button>
            <WhatsAppShareButton whatsApp={whatsApp} />
          </>
        )}
        {phase === "waiting" && (
          <Button disabled variant="secondary" className="h-12 text-base font-bold">
            <LockIcon className="size-5" aria-hidden />
            {fill(copy.waitingAd, { seconds: remainingSeconds })}
          </Button>
        )}
        {downloading ? null : (
          <Progress value={progress} aria-label={copy.progress} className="[&>*]:bg-accent h-1.5" />
        )}
      </div>

      {onFullHd ? (
        <article className="bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
              <ZapIcon className="size-5" aria-hidden />
            </span>
            <h3 className="text-lg font-bold">{copy.skipTitle}</h3>
          </div>
          <p className="text-muted-foreground text-sm">{copy.skipText}</p>
          <Button
            variant="secondary"
            className="text-primary h-auto min-h-12 justify-between px-4 py-2 text-left font-bold whitespace-normal"
            onClick={onFullHd}
          >
            {copy.skipButton}
            <ArrowRightIcon className="size-5" aria-hidden />
          </Button>
        </article>
      ) : null}

      <p className="bg-muted flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
        <FilmIcon className="text-primary size-5" aria-hidden />
        <span className="flex-1">
          {fill(copy.file, { quality: qualityLabel(format), ext: format.ext.toUpperCase() })}
        </span>
        {format.filesize_bytes ? (
          <span className="text-muted-foreground">{formatMegabytes(format.filesize_bytes)}</span>
        ) : null}
      </p>
    </section>
  );
};
