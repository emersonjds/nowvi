import { ZapIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const Hero = () => (
  <div className="flex flex-col items-center gap-4 text-center">
    <Badge variant="secondary" className="text-primary h-7 px-3">
      <ZapIcon aria-hidden />
      Grátis até 720p • Sem cadastro
    </Badge>
    <h1 className="max-w-2xl text-[32px] leading-[38px] font-extrabold tracking-tight text-balance md:text-[44px] md:leading-[52px]">
      Baixe vídeos de qualquer rede, <span className="text-primary">num lugar só.</span>
    </h1>
    <p className="text-muted-foreground max-w-xl text-base text-pretty md:text-lg">
      Reels do Instagram, vídeos do TikTok, posts do X e vídeos do Facebook salvos no seu celular em instantes.
    </p>
  </div>
);
