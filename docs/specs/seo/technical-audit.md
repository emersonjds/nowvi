# Auditoria de SEO técnico (NOWVI-36)

Data: 2026-10-30. Base: código da branch `docs/NOWVI-36-seo-roadmap` (= `developer` em `9650db0`), o
build local `apps/web/.next` do mesmo commit e a produção em
`https://web-production-41797e.up.railway.app`, sondada com `curl` no mesmo dia. Os caminhos são
relativos a `apps/web/`. O i18n (pt-br, en, es, id) está sendo feito em outra branch, então os
achados de idioma valem como critério de aceite para ela, não como patch aqui.

Lab de Core Web Vitals: **não medido**. A cota do PageSpeed Insights estourou e o Lighthouse local
não teve permissão. O card SEO-04 mede em campo (CrUX + `web-vitals`).

## Severidade

- **P0**: impede indexar ou rankear agora.
- **P1**: custa posição ou citação de forma mensurável.
- **P2**: higiene.

## P0

| # | Onde | Problema | Correção |
|---|---|---|---|
| 1 | produção; `src/config/app-config.ts:3` | O `nowvi.com.br` **não existe**: o RDAP do registro.br responde `404` e o `dig @8.8.8.8` não acha NS nem A. Por isso o build usa o host do Railway, e canonical, `og:url`, sitemap e `Sitemap:` do robots apontam para `web-production-41797e.up.railway.app`. Tudo o que o Google indexar agora fica num host descartável. | Registrar o `.com.br` hoje (NOWVI-5) e decidir o global (NOWVI-29, ver `roadmap.md`). Depois, `NEXT_PUBLIC_SITE_URL` no domínio final e 301 por host do `*.up.railway.app` para ele (no `proxy.ts` do Next 16 ou na borda). Até lá, não cadastrar o host do Railway no Search Console nem em diretório. |
| 2 | `public/llms.txt:22-25`; `src/app/_components/site-footer.tsx:9` | O `llms.txt` lista links absolutos para `https://nowvi.com.br/...`, que não resolve, e o rodapé manda e-mail para `contato@nowvi.com.br`, sem MX. Para um LLM, a entidade aponta para um domínio morto. | Gerar o `llms.txt` por route handler (`src/app/llms.txt/route.ts`) a partir de `APP_CONFIG.url` e das `LANDINGS`. O e-mail só volta a aparecer quando o domínio tiver MX. |
| 3 | `src/app/_components/faq.tsx:13-22` | O FAQ usa o Accordion do Radix, que não monta o conteúdo fechado. No HTML do servidor (`.next/server/app/baixar-video-tiktok.html`), a pergunta aparece e **a resposta não**: ela fica só no payload RSC e no JSON-LD. O Google e os crawlers de LLM sem JS veem pergunta sem resposta, e o texto citável some. | Trocar por `<details>`/`<summary>` nativo, renderizado no servidor e sem JS, ou `forceMount` com `hidden`. Aceite: `curl` da página contém o texto de todas as respostas fora de `<script>`. |

## P1

| # | Onde | Problema | Correção |
|---|---|---|---|
| 4 | `src/app/_content/landings.ts:172-186`; `src/app/sitemap.ts:8` | Não há `hreflang`: `pageMetadata` não tem `alternates.languages`, e o sitemap não tem `alternates`. Sem isso, en/es/id competem entre si e com o pt-BR. | `alternates: { canonical, languages: { "pt-BR", "en", "es", "id", "x-default" } }` em toda página, e as mesmas alternates por URL no `sitemap.ts`. Cada página aponta para si e para todas as irmãs (reciprocidade). Fonte: [Google, versões localizadas](https://developers.google.com/search/docs/specialty/international/localized-versions). |
| 5 | `src/app/layout.tsx:27,36`; `src/app/_content/landings.ts:179` | `lang="pt-BR"` e `og:locale=pt_BR` estão fixos no layout raiz. | `lang` e `og:locale` vêm do segmento `[locale]`, com `og:locale:alternate` para os outros idiomas. |
| 6 | `src/lib/json-ld.ts:17,26,37` e `:18-21` | O `inLanguage` é fixo em `pt-BR`, e as `offers` são sempre em BRL, com o Full HD de R$ 2. Fora do Brasil não há Full HD, então a oferta seria falsa nas páginas en/es/id. | `inLanguage` vem do locale, e as `offers` saem do dicionário: fora do pt-BR, só a `Offer` de preço 0. |
| 7 | `src/lib/json-ld.ts:8-45` | Não há `Organization` nem `WebSite` com `@id`, `logo` e `sameAs`, nem `BreadcrumbList`. Para GEO, a entidade "Nowvi" não tem âncora estável. | Um `Organization` (`@id: <site>/#org`, `name`, `url`, `logo`, `sameAs` com GitHub, Product Hunt, AlternativeTo e X quando existirem) e um `WebSite` no layout. O `WebApplication` ganha `publisher: {"@id": "#org"}`, e cada landing ganha `BreadcrumbList` (Início > TikTok > iPhone). Fonte: [Google, breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb). |
| 8 | build: 10 scripts, **830 KB crus / 259 KB gzip** por página. O chunk do app tem 249 KB crus / 79 KB gzip, com zod, lucide e Radix (Accordion e Dialog). | Em celular Android de entrada isso pesa no INP e no TBT. Tudo o que só aparece depois do `/api/info` vai no primeiro load. | `zod/mini` em `src/lib/api.ts:1`. `next/dynamic` para `PixSheet`, `WaitingPanel`, `QualityOptions` e `AdSlot` (`src/app/_components/downloader.tsx:30-34`). FAQ nativo (item 3) tira o Accordion do bundle. Meta: chunk do app < 35 KB gzip e total < 180 KB gzip. |
| 9 | produção | Não há CDN: o HTML sai do Railway (`server: railway-hikari`), com TTFB de 0,22 a 0,45 s a partir do Brasil. Da Ásia e da Europa, esse tempo cresce. Só gzip, sem brotli. | Cloudflare na frente do web (proxy), com cache do HTML estático, brotli e Crawler Hints (que dispara IndexNow sozinho). Combina com o NOWVI-26. |
| 10 | `src/app/_content/landings.ts:170,183-185` | O `openGraph.images` é a string `/opengraph-image`. Ao sobrescrever o arquivo convencional, o Next deixa de emitir `og:image:width`, `og:image:height`, `og:image:type` e `og:image:alt`. Conferido no HTML: só sai o `og:image`. | `images: [{ url: "/opengraph-image", width: 1200, height: 630, alt, type: "image/png" }]`, ou um `opengraph-image.tsx` por landing e locale, com o H1 da página. |
| 11 | `src/app/opengraph-image.tsx:3,25` | A imagem OG só tem o texto em pt-BR. Compartilhada em en, es ou id, a prévia sai em português. | `opengraph-image.tsx` dentro de `[locale]`, com o texto do dicionário. |
| 12 | `src/app/layout.tsx:12-15` | O `Plus_Jakarta_Sans` só carrega `subsets: ["latin"]`. Os acentos do vi (ạ, ằ, ữ), do tr (ğ, ş, ı) e do pl (ą, ł, ż) caem na fonte de fallback no meio da palavra. | Somar `latin-ext` e `vietnamese` quando esses locales entrarem. Thai, japonês e coreano usam a fonte do sistema (a Jakarta não cobre esses alfabetos), então o fallback desses precisa ser conferido. |

## P2

| # | Onde | Problema | Correção |
|---|---|---|---|
| 13 | `next.config.mjs:35-44` | A resposta sai com `x-powered-by: Next.js`. | `poweredByHeader: false`. |
| 14 | `next.config.mjs:21-26` | Não há `Strict-Transport-Security`. | `max-age=63072000; includeSubDomains; preload` depois que o domínio final estiver só em HTTPS. |
| 15 | `next.config.mjs:43` | `/baixar-video-instagram` faz 302 para `/`. Como temporário está certo, mas se a pausa (NOWVI-20) passar de ~3 meses, trocar por 410 ou devolver a landing com aviso. Ela tem 1 M de buscas/mês (ver `keywords.md`). | Revisar no D+60. |
| 16 | `src/config/app-config.ts:9-17` | `keywords` é ignorado pelo Google. | Remover ou deixar como está, porque não custa nada. |
| 17 | `src/app/sitemap.ts:8` | Não há `lastModified`. O Bing e o IndexNow usam essa data. | `lastModified` = data do build, ou do conteúdo, quando houver CMS. |
| 18 | `next.config.mjs:30-33` | O build exige `NEXT_PUBLIC_SITE_URL`, mas aceita qualquer valor, inclusive `http://localhost:3000` (o build local saiu com canonical em localhost). | No build de produção, falhar se não for `https://` ou se o host terminar em `.up.railway.app` ou for `localhost`. |
| 19 | `src/lib/json-ld.ts:42` | Nas landings, o `HowToStep.text` repete o `name`, porque os passos só têm `title`. | Escrever um `text` próprio por passo no dicionário. O HowTo não dá rich result desde 2023 ([Google](https://developers.google.com/search/blog/2023/08/howto-faq-changes)), mas continua útil para os LLMs. |

## O que está certo (não mexer)

- `robots.ts:26-31` libera `*` e todos os bots de IA, com `Sitemap:`. Em produção, `/robots.txt` = 200.
- O 404 sai com `<meta name="robots" content="noindex">` e status 404 de verdade (`/nao-existe` → 404).
- `[slug]/page.tsx:10-12`: as landings são estáticas (`dynamicParams = false`, `generateStaticParams`).
- O canonical da home, sem barra, e o `<loc>` do sitemap, com barra, são a mesma URL (raiz).
- O H1 é texto renderizado no servidor (`hero.tsx:13`), e a página não tem `<img>`, então o LCP é texto.
- `ad-slot.tsx:22` reserva 250 px antes do anúncio, que só aparece no estado de espera. O CLS na carga é zero.
- `cookie-banner.tsx:52`: o espaçador entra no fim do body e o banner é `fixed`, então nada acima se
  move. O aviso de cookie é uma exceção legal ao intersticial intrusivo.
- Fonte: `next/font` hospeda o arquivo, faz preload do woff2 e usa `display: swap` com fallback
  ajustado. Não bloqueia o render.
- A linkagem entre as redes (`download-page.tsx:47-67`) existe e é rastreável (`<a href>`).
- `/llms.txt` = 200 em produção.
