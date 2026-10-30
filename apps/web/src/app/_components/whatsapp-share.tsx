"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { usePathname } from "next/navigation";

import { CircleAlertIcon, LoaderCircleIcon, SendIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { fill, useDictionary } from "@/i18n/client";
import { downloadUrl, type FreeFormat, type VideoFormat } from "@/lib/api";
import {
  canShareFiles,
  fetchVideoBlob,
  MAX_SHARE_BYTES,
  pickShareableFormat,
  whatsAppLinkUrl,
} from "@/lib/share-video";

type Preparation =
  | { token: string; status: "ready"; file: File; objectUrl: string }
  | { token: string; status: "failed" };

export type ShareStatus = "hidden" | "unsupported" | "idle" | "preparing" | "ready" | "failed";

const subscribeNever = () => () => undefined;

const canShareFromPhone = () => canShareFiles() && window.matchMedia("(pointer: coarse)").matches;

const isCancel = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

type ShareOptions = { formats: readonly VideoFormat[]; chosen: FreeFormat; active: boolean };

export const useWhatsAppShare = ({ formats, chosen, active }: ShareOptions) => {
  const filesSupported = useSyncExternalStore(subscribeNever, canShareFromPhone, () => false);
  const shareFormat = filesSupported ? pickShareableFormat(formats, chosen) : null;
  const [tappedToken, setTappedToken] = useState<string | null>(null);
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const requested = shareFormat !== null && (shareFormat.token === chosen.token || shareFormat.token === tappedToken);
  const wantedToken = active && requested ? shareFormat.token : null;
  const fallbackFileName = shareFormat ? `nowvi-${shareFormat.quality}.${shareFormat.ext}` : "";

  useEffect(() => {
    if (!wantedToken) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    fetchVideoBlob(downloadUrl(wantedToken), { maxBytes: MAX_SHARE_BYTES, signal: controller.signal })
      .then(({ blob, fileName }) => {
        if (controller.signal.aborted) return;
        const file = new File([blob], fileName ?? fallbackFileName, { type: blob.type });
        if (!navigator.canShare({ files: [file] })) throw new Error("file type not shareable");
        objectUrl = URL.createObjectURL(file);
        setPreparation({ token: wantedToken, status: "ready", file, objectUrl });
      })
      .catch(() => {
        if (!controller.signal.aborted) setPreparation({ token: wantedToken, status: "failed" });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [wantedToken, fallbackFileName]);

  const current = preparation?.token === wantedToken ? preparation : null;

  const statusOf = (): ShareStatus => {
    if (!filesSupported) return "unsupported";
    if (!shareFormat) return "hidden";
    if (current) return current.status;
    return wantedToken ? "preparing" : "idle";
  };

  const share = () => {
    if (current?.status !== "ready") return;
    // Called straight from the click: the share sheet needs the tap's user activation.
    navigator.share({ files: [current.file] }).catch((error: unknown) => {
      if (!isCancel(error)) setPreparation({ token: current.token, status: "failed" });
    });
  };

  const savedVideo =
    current?.status === "ready" && current.token === chosen.token
      ? { href: current.objectUrl, fileName: current.file.name }
      : null;

  return {
    status: statusOf(),
    quality: shareFormat?.quality ?? "",
    savedVideo,
    prepare: () => setTappedToken(shareFormat?.token ?? null),
    share,
  };
};

export type WhatsAppShare = ReturnType<typeof useWhatsAppShare>;

const BUTTON_CLASS = "h-12 text-base font-bold";

const ShareControl = ({ whatsApp }: { whatsApp: WhatsAppShare }) => {
  const copy = useDictionary().waiting.share;
  const pageUrl = `${APP_CONFIG.url}${usePathname()}`;

  switch (whatsApp.status) {
    case "hidden":
      return null;
    case "unsupported":
      return (
        <Button asChild variant="secondary" className={BUTTON_CLASS}>
          <a href={whatsAppLinkUrl(fill(copy.linkText, { url: pageUrl }))} target="_blank" rel="noopener noreferrer">
            <Share2Icon className="size-5" aria-hidden />
            {copy.shareLink}
          </a>
        </Button>
      );
    case "idle":
      return (
        <Button variant="secondary" className={BUTTON_CLASS} onClick={whatsApp.prepare}>
          <SendIcon className="size-5" aria-hidden />
          {fill(copy.prepare, { quality: whatsApp.quality })}
        </Button>
      );
    case "preparing":
      return (
        <Button disabled variant="secondary" className={BUTTON_CLASS}>
          <LoaderCircleIcon className="size-5 animate-spin" aria-hidden />
          {copy.preparing}
        </Button>
      );
    case "ready":
      return (
        <Button variant="secondary" className={BUTTON_CLASS} onClick={whatsApp.share}>
          <SendIcon className="size-5" aria-hidden />
          {copy.send}
        </Button>
      );
    case "failed":
      return (
        <p className="bg-muted flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium">
          <CircleAlertIcon className="text-primary size-5" aria-hidden />
          {copy.failed}
        </p>
      );
  }
};

export const WhatsAppShareButton = ({ whatsApp }: { whatsApp: WhatsAppShare }) =>
  whatsApp.status === "hidden" ? null : (
    <div aria-live="polite" className="flex flex-col">
      <ShareControl whatsApp={whatsApp} />
    </div>
  );
