"use client";

import { useEffect, useRef, useState } from "react";

import { CirclePlayIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrder, ERROR_MESSAGES, type ErrorCode, type VideoInfo } from "@/lib/api";

import { VideoCard } from "./video-card";

type PixSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  video: VideoInfo;
  onFree: () => void;
};

export const PixSheet = ({ open, onOpenChange, url, video, onFree }: PixSheetProps) => {
  const [result, setResult] = useState<ErrorCode | "loading">("loading");
  const requested = useRef(false);

  // The downloader keys this sheet by token, so the order is created once per token.
  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;
    // ponytail: no QR flow until NOWVI-2, so any accepted order still reads as "coming soon".
    void createOrder(url).then((response) => setResult(response.ok ? "payments_disabled" : response.code));
  }, [open, url]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[90dvh] max-w-xl overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="px-4 pt-5 pb-0">
          <SheetTitle className="text-xl font-bold">Full HD 1080p com Pix</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ShieldCheckIcon className="text-primary size-4" aria-hidden />
            Cobrança única de R$ 2,00, sem assinatura.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <VideoCard video={video} detail="Full HD 1080p" />
          <div className="bg-muted flex flex-col items-center gap-1 rounded-2xl p-4">
            <p className="text-muted-foreground text-sm">Total a pagar</p>
            <p className="text-primary text-3xl font-extrabold">R$ 2,00</p>
          </div>
          <div aria-live="polite">
            {result === "loading" ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : (
              <p className="bg-secondary rounded-xl p-4 text-center font-medium">{ERROR_MESSAGES[result]}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold"
            onClick={onFree}
          >
            <CirclePlayIcon className="size-5" aria-hidden />
            Baixar Grátis (720p)
          </Button>
          <SheetClose asChild>
            <Button variant="ghost" className="h-11">
              Fechar
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};
