# Nowvi v0: one page de download de vídeo

Epic NOWVI-6 no santi. Fonte visual: `design/` (export do Stitch, projeto `16508560692008980090`).

## Objetivo

Publicar hoje uma página única em pt-BR: a pessoa cola o link de um vídeo de Instagram, TikTok, X
ou Facebook, assiste a 30 s de anúncio e baixa em até 720p. O Full HD custa R$ 2 no Pix e aparece
na tela, mas o gateway só será ligado no NOWVI-2 (AbacatePay, taxa fixa de R$ 0,80).

## Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Extração | Rust (axum) chamando o binário `yt-dlp` | O yt-dlp cobre as 4 redes e é atualizado sem recompilar. Um extrator próprio quebraria toda semana. |
| Redes v0 | Instagram, TikTok, X e Facebook | O YouTube bloqueia IP de datacenter, e o PO token fica no NOWVI-14. |
| Arquivo | Stream direto do stdout do yt-dlp, nada em disco | Sem armazenamento nem limpeza. O egress do Railway custa US$ 0,05/GB. |
| Origem | O browser chama a API direto (`NEXT_PUBLIC_API_URL`), com CORS para `WEB_ORIGIN` | Proxy pelo Next pagaria o egress do vídeo duas vezes. |
| Espera do anúncio | Token HMAC com `nbf` = emissão + `AD_WAIT_SECONDS` | Sem o token, a espera seria só visual. |
| Ads | Slots com altura reservada e script por env (Adsterra/Monetag). Sem conta aprovada, vai um anúncio da casa do Full HD | O AdSense bane site de download. CLS zero. |
| Bots de IA | `robots` libera todos, inclusive os de treino | A meta é os LLMs conhecerem e recomendarem o Nowvi. |
| Testes | Fora da v0, por pedido do Emerson, e ficam no NOWVI-15 | Desvio consciente do critério de pronto global. |

## Contrato da API (`crates/nowvi-api`)

Todas as respostas de erro são `{"error": "<codigo>"}`. A web mapeia o código para um texto fixo
e nunca mostra o corpo da resposta.

### `GET /health`
`200` com o texto `ok`.

### `POST /api/info`
Corpo: `{"url": "https://..."}`. A URL precisa ser `https` e o host tem de terminar em um destes:
`instagram.com`, `tiktok.com`, `x.com`, `twitter.com`, `facebook.com`, `fb.watch`.

`200`:
```json
{
  "platform": "instagram",
  "title": "string",
  "author": "string | null",
  "thumbnail": "https://... | null",
  "duration_seconds": 48,
  "free": {
    "height": 720,
    "filesize_bytes": 18400000,
    "token": "string",
    "available_at": 1793330000,
    "wait_seconds": 30,
    "expires_in_seconds": 930
  },
  "full_hd_available": true
}
```
- `platform`: `instagram`, `tiktok`, `x` ou `facebook`.
- `filesize_bytes` pode vir `null`.
- `available_at`: unix em segundos, a partir do qual o token vale.
- `wait_seconds` e `expires_in_seconds` são relativos ao momento da resposta. A web conta a espera
  por eles, nunca pelo relógio do aparelho.
- `thumbnail` só sai quando é `https`. Fora disso, vem `null`.

Erros:
- `400 invalid_url`: não é URL https, tem userinfo ou tem porta.
- `422 unsupported_platform`: o host está fora da lista.
- `422 too_long`: o vídeo passa de 15 min.
- `404 not_found`: o vídeo é privado, foi apagado ou o post não tem vídeo.
- `429 rate_limited`
- `502 extract_failed`: o yt-dlp falhou ou passou de 25 s.
- `503 busy`: o semáforo está cheio ou o IP já tem 2 jobs em andamento.

Execução: `yt-dlp -J --no-playlist --flat-playlist --ignore-config --no-plugin-dirs --no-cache-dir
--use-extractors instagram,tiktok,twitter,facebook -f "<FREE_FORMAT>" -- <url>`, com timeout de 25 s.
O ambiente vai limpo (só `PATH` e `HOME=/tmp`), o stdout é limitado a 2 MiB e o stderr a 8 KiB.
Depois do `-J`, o `webpage_url` passa de novo pelo allowlist.

A escolha dos formatos (a lista `formats`, com um token por qualidade grátis) está em
`docs/specs/cards/NOWVI-22-formats.md`. O probe roda com `-f b*` e lê o `formats[]` completo.

### `GET /api/download?token=<token>`
- `200` faz stream de `yt-dlp -f <format_id> --no-playlist --max-filesize 500M -o - -- <url>` (com
  as mesmas flags e o mesmo ambiente do info). Headers: `Content-Type` pela `ext`,
  `Content-Disposition: attachment; filename="nowvi-<platform>-<unix>.<ext>"`,
  `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.
- Limites do stream: 10 min no total, e 30 s sem chunk encerra.
- O download é uma navegação do browser, então o erro **não** vem em JSON. A resposta é `303` para
  `<primeiro WEB_ORIGIN>/?erro=<codigo>`, com o código sendo `invalid_token`, `too_early`,
  `expired`, `busy` ou `extract_failed`. A web lê o `?erro=`, mostra o texto fixo e limpa a query.
- Um download concluído grava uma linha em `downloads` (`platform`, `quality` = `"720p"`, `created_at`).
  Se a gravação falhar, o erro vai para o log e o download não cai.
- Se o cliente desconectar, o processo filho morre (`kill_on_drop`).

### `POST /api/orders`
Na v0 responde `503 payments_disabled` enquanto `ABACATEPAY_API_KEY` não estiver definida. O fluxo real
fica no NOWVI-2.

### Token
O formato é `base64url(json).base64url(hmac_sha256(secret, json))`, com o json
`{"u": url, "p": platform, "f": format_id, "e": ext, "nbf": unix, "exp": unix}`. A comparação do HMAC é em
tempo constante.

### Proteções
- Rate limit por IP em `/api/*`, com burst de 10 e reposição de 1 a cada 3 s. O IP vem de
  `X-Real-IP` e, na falta dele, do último item do `X-Forwarded-For`, porque o Railway fica na
  frente. IPv6 é agrupado por /64.
- No máximo 2 jobs em andamento por IP, somando info e download, com IPv6 agrupado por /48.
- Cada download tem um watchdog que mata o yt-dlp e libera o slot no prazo total (10 min), após
  30 s sem chunk ou quando o cliente sai.
- O token pode ser reusado até o `exp`, e cada reuso conta como um download. O nonce de uso único
  fica para depois.
- Semáforo global de `MAX_CONCURRENT_JOBS` (padrão 6) processos de yt-dlp.
- A URL vai depois de `--`, para nunca virar flag. O processo filho não passa por shell.
- O corpo é limitado a 4 KB.

### Banco (Postgres, `sqlx::migrate!` no boot)
- `downloads(id bigserial pk, platform text not null, quality text not null, created_at timestamptz not null default now())`
- `orders(id uuid pk default gen_random_uuid(), source_url text not null, platform text not null, format_id text not null, amount_cents int not null default 200, status text not null default 'pending' check (status in ('pending','paid','expired')), provider_ref text, created_at timestamptz not null default now(), paid_at timestamptz)`

### Env
| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | 8080 | porta HTTP |
| `DATABASE_URL` | obrigatório | Postgres |
| `DOWNLOAD_TOKEN_SECRET` | obrigatório, 32+ bytes | HMAC |
| `WEB_ORIGIN` | `http://localhost:3000` | origens do CORS, separadas por vírgula |
| `AD_WAIT_SECONDS` | 30 | espera do anúncio |
| `MAX_CONCURRENT_JOBS` | 6 | semáforo |
| `YTDLP_BIN` | `yt-dlp` | binário |

## Web (`apps/web`)

A base é o next-shadcn-admin-dashboard. Fica só o necessário: `components/ui`, tema e fontes.
Saem as rotas de dashboard, auth, chat e mail, a sidebar e o gtag do autor do template.

Uma página com estados encadeados, sem trocar de rota:
1. **Home** (`design/1-home`): hero, input com o botão "Colar" (clipboard), "Baixar Agora", os chips
   das redes, "Como funciona", FAQ, rodapé e o banner de cookies LGPD.
2. **Detalhes e qualidade** (`design/2-escolha-de-qualidade`): card do vídeo, card do Full HD com
   R$ 2 e card do Grátis 720p.
3. **Espera** (`design/3-espera-com-anuncio-gratis`): contagem regressiva por `wait_seconds`, slot
   do anúncio, barra de progresso e o upsell de Full HD. Ao fim, o botão vira "Baixar agora", que
   aponta o link para `GET /api/download`.
4. **Pix** (`design/4-pagamento-pix`): sheet com o resumo. Com `payments_disabled`, mostra o aviso
   "Pix chega em breve".

Estados de erro com texto fixo, um para cada código da API. O `/api/info` mostra loading com
skeleton.

SEO/GEO (NOWVI-10):
- Metadata pt-BR, OG e JSON-LD (`WebApplication`, `FAQPage`, `HowTo`).
- Landings `/baixar-video-instagram`, `/baixar-video-tiktok`, `/baixar-video-x` e
  `/baixar-video-facebook`, usando o mesmo componente da home com H1 e copy próprios.
- `sitemap.ts`, `robots.ts` (libera todos os bots de IA) e `public/llms.txt`.

Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_ADSTERRA_BANNER_KEY` (opcional).
Como as `NEXT_PUBLIC_*` são inlined no build, o Dockerfile as declara como `ARG`.

## Deploy (NOWVI-11)

Projeto Railway `nowvi`, com os serviços `web`, `api` e `Postgres`. Cada app tem seu Dockerfile e
seu `railway.toml`, e o build parte da raiz do repo (`.dockerignore` na raiz). O Railway faz o
deploy a partir da `main`.

- **`api`:** imagem `debian:bookworm-slim`, com `tini` e o standalone `yt-dlp_linux` numa versão
  fixa (`ARG YTDLP_VERSION`), conferido pelo `SHA2-256SUMS`. Não tem python nem ffmpeg; o ffmpeg
  volta no NOWVI-13. Roda como usuário não-root e tem healthcheck em `/health`.
- **`web`:** build `output: "standalone"`, com as `NEXT_PUBLIC_*` como `ARG` e
  `node server.js` como usuário `node`.

## Fora da v0

- MCP: NOWVI-12.
- Full HD com merge: NOWVI-13.
- YouTube: NOWVI-14.
- Testes: NOWVI-15.
- Rebuild do yt-dlp: NOWVI-16.
- Tela de download pronto: NOWVI-17.
- Pix: NOWVI-2.
- Rede de anúncio real: NOWVI-4.
