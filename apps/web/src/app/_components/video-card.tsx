import { FilmIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Platform, VideoInfo } from "@/lib/api";

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
};

const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

type VideoCardProps = { video: VideoInfo; detail?: string };

export const VideoCard = ({ video, detail }: VideoCardProps) => (
  <article className="bg-card flex gap-4 rounded-2xl border p-4 shadow-sm">
    <div className="bg-muted relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl sm:w-32">
      {video.thumbnail ? (
        // biome-ignore lint/performance/noImgElement: thumbnails come from arbitrary social CDNs, outside next/image remotePatterns
        <img src={video.thumbnail} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <FilmIcon className="text-muted-foreground absolute inset-0 m-auto size-8" aria-hidden />
      )}
      {video.duration_seconds ? (
        <span className="bg-foreground/80 text-background absolute right-1.5 bottom-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold">
          {formatDuration(video.duration_seconds)}
        </span>
      ) : null}
    </div>
    <div className="flex min-w-0 flex-col gap-2">
      <Badge variant="secondary" className="text-primary">
        {PLATFORM_LABEL[video.platform]}
      </Badge>
      <h2 className="line-clamp-3 text-lg leading-6 font-semibold">{video.title}</h2>
      {video.author ? <p className="text-muted-foreground truncate text-sm">{video.author}</p> : null}
      {detail ? <p className="text-sm font-medium">{detail}</p> : null}
    </div>
  </article>
);
