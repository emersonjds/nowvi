import { CirclePlayIcon, MonitorPlayIcon, QrCodeIcon, StarIcon, ZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FreeFormat, VideoFormat } from "@/lib/api";

export const qualityLabel = ({ quality, height }: VideoFormat) => {
  if (height >= 1080) return `${quality} Full HD`;
  if (height >= 720) return `${quality} HD`;
  return quality;
};

export const formatMegabytes = (bytes: number) =>
  `~${(bytes / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;

type QualityOptionsProps = {
  formats: VideoFormat[];
  selected: FreeFormat;
  onSelect: (format: FreeFormat) => void;
  onFree: () => void;
  onFullHd: () => void;
};

export const QualityOptions = ({ formats, selected, onSelect, onFree, onFullHd }: QualityOptionsProps) => {
  const fullHd = formats.find((format) => format.tier === "full_hd");
  const free = formats.filter((format) => format.tier === "free");

  return (
    <section aria-labelledby="qualidade-titulo" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="qualidade-titulo" className="text-xl font-semibold tracking-tight">
          Escolha como baixar
        </h2>
        <p className="text-muted-foreground text-sm">{fullHd ? "2 opções" : "1 opção"}</p>
      </div>

      {fullHd ? (
        <article className="border-primary bg-card relative flex flex-col gap-4 overflow-hidden rounded-2xl border-2 p-5 shadow-sm">
          <span className="bg-primary text-primary-foreground absolute top-0 right-0 flex items-center gap-1 rounded-bl-xl px-3 py-1 text-xs font-semibold">
            <StarIcon className="size-3.5" aria-hidden />
            Recomendado
          </span>
          <div className="flex items-end justify-between gap-4 pt-4">
            <h3 className="text-2xl leading-7 font-bold">{qualityLabel(fullHd)}</h3>
            <p className="text-primary text-xl font-bold">R$ 2,00</p>
          </div>
          <p className="text-muted-foreground">Sem anúncio, na velocidade máxima e liberado na hora pelo Pix.</p>
          <ul className="bg-muted grid grid-cols-2 gap-2 rounded-xl p-3 text-sm">
            <li className="flex items-center gap-2">
              <ZapIcon className="text-primary size-4" aria-hidden />
              Download instantâneo
            </li>
            <li className="flex items-center gap-2">
              <MonitorPlayIcon className="text-primary size-4" aria-hidden />
              Nitidez original
            </li>
          </ul>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold"
            onClick={onFullHd}
          >
            <QrCodeIcon className="size-5" aria-hidden />
            Liberar Full HD com Pix
          </Button>
        </article>
      ) : null}

      <article className="bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">
            Grátis <span className="text-muted-foreground text-base font-medium">até {free[0]?.quality}</span>
          </h3>
          <p className="bg-muted rounded-md px-2 py-0.5 text-sm font-semibold">R$ 0,00</p>
        </div>
        <p className="text-muted-foreground">Assista a um anúncio curto de 30 segundos e baixe sem pagar nada.</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Qualidade do download grátis</legend>
          {free.map((format) => (
            <label
              key={format.token}
              className="has-checked:border-primary has-checked:bg-muted has-focus-visible:ring-ring flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name="qualidade-gratis"
                className="accent-primary size-5 shrink-0"
                checked={format.token === selected.token}
                onChange={() => onSelect(format)}
              />
              <span className="flex-1 font-semibold">{qualityLabel(format)}</span>
              {format.filesize_bytes ? (
                <span className="text-muted-foreground text-sm">{formatMegabytes(format.filesize_bytes)}</span>
              ) : null}
            </label>
          ))}
        </fieldset>
        <Button variant="secondary" className="h-12 text-base font-bold" onClick={onFree}>
          <CirclePlayIcon className="size-5" aria-hidden />
          Baixar grátis ({selected.quality})
        </Button>
      </article>
    </section>
  );
};
