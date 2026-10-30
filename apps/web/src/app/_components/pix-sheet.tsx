"use client";

import { useEffect, useRef, useState } from "react";

import { CirclePlayIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDictionary } from "@/i18n/client";
import { createOrder, type ErrorCode, type VideoInfo } from "@/lib/api";

import { VideoCard } from "./video-card";

type PixSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  video: VideoInfo;
  onFree: () => void;
};

export const PixSheet = ({ open, onOpenChange, url, video, onFree }: PixSheetProps) => {
  const dictionary = useDictionary();
  const copy = dictionary.pix;
  const [orderStatus, setOrderStatus] = useState<ErrorCode | "loading">("loading");
  const orderRequested = useRef(false);

  // One order per token: the downloader keys this sheet by the free token.
  useEffect(() => {
    if (!open || orderRequested.current) return;
    orderRequested.current = true;
    // ponytail: no QR flow until NOWVI-2, so any accepted order still reads as "coming soon".
    void createOrder(url).then((order) => setOrderStatus(order.ok ? "payments_disabled" : order.code));
  }, [open, url]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[90dvh] max-w-xl overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="px-4 pt-5 pb-0">
          <SheetTitle className="text-xl font-bold">{copy.title}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ShieldCheckIcon className="text-primary size-4" aria-hidden />
            {copy.description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <VideoCard video={video} detail={copy.detail} />
          <div className="bg-muted flex flex-col items-center gap-1 rounded-2xl p-4">
            <p className="text-muted-foreground text-sm">{copy.total}</p>
            <p className="text-primary text-3xl font-extrabold">R$ 2,00</p>
          </div>
          <div aria-live="polite">
            {orderStatus === "loading" ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : (
              <p className="bg-secondary rounded-xl p-4 text-center font-medium">{dictionary.errors[orderStatus]}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold"
            onClick={onFree}
          >
            <CirclePlayIcon className="size-5" aria-hidden />
            {copy.free}
          </Button>
          <SheetClose asChild>
            <Button variant="ghost" className="h-11">
              {copy.close}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};
