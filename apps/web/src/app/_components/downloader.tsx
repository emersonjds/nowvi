"use client";

import { type FormEvent, type ReactNode, useEffect, useReducer, useRef, useState } from "react";

import {
  ArrowLeftIcon,
  AtSignIcon,
  CircleAlertIcon,
  ClipboardPasteIcon,
  DownloadIcon,
  GlobeIcon,
  LinkIcon,
  Music2Icon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useDictionary } from "@/i18n/client";
import { type ErrorCode, errorCodeSchema, type FreeFormat, fetchVideoInfo, type VideoInfo } from "@/lib/api";

import { AdSlot } from "./ad-slot";
import { PixSheet } from "./pix-sheet";
import { QualityOptions } from "./quality-options";
import { VideoCard } from "./video-card";
import { WaitingPanel } from "./waiting-panel";

type Ticket = { video: VideoInfo; format: FreeFormat; readyAt: number; expiresAt: number };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; code: ErrorCode }
  | ({ status: "ready" } & Ticket)
  | ({ status: "waiting"; startedAt: number } & Ticket);

type Action =
  | { type: "submit" }
  | ({ type: "loaded" } & Ticket)
  | { type: "failed"; code: ErrorCode }
  | { type: "choose"; format: FreeFormat }
  | { type: "wait"; startedAt: number }
  | { type: "back" }
  | { type: "reset" };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "submit":
      return { status: "loading" };
    case "loaded":
      return {
        status: "ready",
        video: action.video,
        format: action.format,
        readyAt: action.readyAt,
        expiresAt: action.expiresAt,
      };
    case "failed":
      return { status: "error", code: action.code };
    case "choose":
      return state.status === "ready" ? { ...state, format: action.format } : state;
    case "wait":
      return state.status === "ready" ? { ...state, status: "waiting", startedAt: action.startedAt } : state;
    case "back":
      return state.status === "waiting" ? { ...state, status: "ready" } : state;
    case "reset":
      return { status: "idle" };
  }
};

const PLATFORM_CHIPS = [
  { label: "TikTok", Icon: Music2Icon },
  { label: "X", Icon: AtSignIcon },
  { label: "Facebook", Icon: GlobeIcon },
];

const withScheme = (value: string) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);

export const Downloader = ({ hero }: { hero: ReactNode }) => {
  const dictionary = useDictionary();
  const copy = dictionary.downloader;
  const [state, dispatch] = useReducer(reducer, { status: "idle" });
  const [url, setUrl] = useState("");
  const [pixOpen, setPixOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInputRef = useRef(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("erro");
    if (code === null) return;
    window.history.replaceState(null, "", window.location.pathname);
    const parsed = errorCodeSchema.safeParse(code);
    if (parsed.success) dispatch({ type: "failed", code: parsed.data });
  }, []);

  useEffect(() => {
    if (state.status === "ready" || state.status === "waiting") {
      sectionRef.current?.scrollIntoView({ block: "start" });
      sectionRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    }
    if (state.status === "error" || (state.status === "idle" && focusInputRef.current)) {
      focusInputRef.current = false;
      inputRef.current?.focus();
    }
  }, [state.status]);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setUrl(text.trim());
    } catch {
      // Clipboard denied or unsupported: the person pastes by hand.
    }
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    const normalized = withScheme(value);
    setUrl(normalized);
    dispatch({ type: "submit" });
    const result = await fetchVideoInfo(normalized);
    if (!result.ok) {
      dispatch({ type: "failed", code: result.code });
      return;
    }
    const format = result.data.formats.find((item) => item.tier === "free");
    if (!format) {
      dispatch({ type: "failed", code: "not_found" });
      return;
    }
    const receivedAt = Date.now();
    dispatch({
      type: "loaded",
      video: result.data,
      format,
      readyAt: receivedAt + result.data.free.wait_seconds * 1000 + 1000,
      expiresAt: receivedAt + result.data.free.expires_in_seconds * 1000,
    });
  };

  const reset = () => {
    setPixOpen(false);
    setUrl("");
    focusInputRef.current = true;
    dispatch({ type: "reset" });
  };

  const expire = () => {
    setPixOpen(false);
    dispatch({ type: "failed", code: "expired" });
  };

  const startFree = () => {
    if (state.status === "ready" && Date.now() > state.expiresAt) {
      expire();
      return;
    }
    setPixOpen(false);
    dispatch({ type: "wait", startedAt: Date.now() });
  };

  const video = state.status === "ready" || state.status === "waiting" ? state.video : null;
  const fullHd = dictionary.features.fullHdPix && video?.full_hd_available === true;
  const openPix = fullHd ? () => setPixOpen(true) : undefined;

  return (
    <section ref={sectionRef} aria-label={copy.label} className="flex scroll-mt-20 flex-col gap-6">
      {video ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" className="-ml-3 h-11 px-3 text-base" onClick={reset}>
              <ArrowLeftIcon className="size-5" aria-hidden />
              {copy.newSearch}
            </Button>
            <Badge className="bg-accent text-accent-foreground h-7 px-3">{copy.ready}</Badge>
          </div>

          {state.status === "waiting" ? (
            <WaitingPanel
              format={state.format}
              startedAt={state.startedAt}
              readyAt={state.readyAt}
              expiresAt={state.expiresAt}
              onFullHd={openPix}
              onExpired={expire}
              onNewVideo={reset}
              onOtherQuality={() => dispatch({ type: "back" })}
            />
          ) : null}

          {state.status === "ready" ? (
            <>
              <VideoCard video={video} />
              <QualityOptions
                formats={fullHd ? video.formats : video.formats.filter((format) => format.tier === "free")}
                selected={state.format}
                onSelect={(format) => dispatch({ type: "choose", format })}
                onFree={startFree}
                onFullHd={() => setPixOpen(true)}
              />
              <AdSlot onUpgrade={openPix} />
            </>
          ) : null}

          {fullHd ? (
            <PixSheet
              key={video.free.token}
              open={pixOpen}
              onOpenChange={setPixOpen}
              url={url}
              video={video}
              onFree={state.status === "waiting" ? () => setPixOpen(false) : startFree}
            />
          ) : null}
        </>
      ) : (
        <>
          {hero}
          <form
            onSubmit={(event) => void submit(event)}
            className="bg-card flex flex-col gap-3 rounded-3xl border p-3 shadow-lg sm:p-4"
            aria-busy={state.status === "loading"}
          >
            <label htmlFor="video-url" className="sr-only">
              {copy.inputLabel}
            </label>
            <InputGroup className="bg-muted h-14 rounded-2xl">
              <InputGroupAddon>
                <LinkIcon className="size-5" aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                ref={inputRef}
                id="video-url"
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                placeholder={copy.placeholder}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={state.status === "loading"}
                aria-invalid={state.status === "error" && state.code === "invalid_url"}
                aria-describedby={state.status === "error" ? "video-url-erro" : undefined}
                className="h-full text-base md:text-base"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="secondary"
                  className="h-11 rounded-xl px-3 text-sm"
                  onClick={() => void paste()}
                  disabled={state.status === "loading"}
                >
                  <ClipboardPasteIcon className="size-4" aria-hidden />
                  {copy.paste}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <Button
              type="submit"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 rounded-2xl text-lg font-bold"
              disabled={state.status === "loading"}
            >
              <DownloadIcon className="size-5" aria-hidden />
              {state.status === "loading" ? copy.loading : copy.submit}
            </Button>
          </form>

          {state.status === "error" ? (
            <Alert variant="destructive" id="video-url-erro" className="rounded-2xl p-4">
              <CircleAlertIcon aria-hidden />
              <AlertDescription className="text-base">{dictionary.errors[state.code]}</AlertDescription>
            </Alert>
          ) : null}

          {state.status === "loading" ? (
            <div className="bg-card flex gap-4 rounded-2xl border p-4" role="status" aria-label={copy.loading}>
              <Skeleton className="aspect-[3/4] w-24 shrink-0 rounded-xl sm:w-32" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">{copy.worksWith}</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {PLATFORM_CHIPS.map(({ label, Icon }) => (
                  <li
                    key={label}
                    className="bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                  >
                    <Icon className="text-primary size-4" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
};
