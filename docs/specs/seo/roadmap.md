# Roadmap de SEO e GEO: 90 dias (NOWVI-36)

Data: 2026-10-30. Meta do épico: rank 1 no Google e citação por LLM para "baixar vídeo do
TikTok/X/Facebook" no Brasil, na Europa e na Ásia, com foco em quem usa muito TikTok. Os cards
`SEO-nn` estão em `cards.md`. A auditoria está em `technical-audit.md` e as keywords em
`keywords.md`.

## Ponto de partida

- **Não há domínio.** O `nowvi.com.br` não está registrado (RDAP do registro.br = 404, sem NS), e a
  produção roda em `web-production-41797e.up.railway.app`, que já é o canonical. Nada do que vem
  abaixo rende antes do SEO-01 e do SEO-02.
- São 4 URLs indexáveis em pt-BR (home, TikTok, X e Facebook). O i18n (en, es, id) está em andamento.
- Concorrência (setembro de 2026, Semrush): ssstik.io com 101,7 M de visitas/mês, savefrom.net com 169,8 M,
  snaptik.app com 41,7 M, ssstwitter.com com 38,6 M e snapinsta.com.br com 6,37 M, 98,45% dele do
  Brasil. No Ahrefs, o tráfego orgânico do ssstik.io é de ~32 M/mês. Fontes em "Fontes".
- O TikTok oficial (`tiktok.com/download-video`) baixa **com** marca d'água. O "sem marca d'água" é
  o espaço que a SERP oficial não cobre.
- Horizonte realista: em 90 dias, o domínio novo chega ao top 10 da cauda longa (iPhone, PC,
  WhatsApp, "sem marca d'água") e ao top 30 das cabeças. O rank 1 em "baixar video tiktok" (791 mil
  buscas/mês) disputa com domínios de anos e muitos backlinks, e é meta de 6 a 12 meses.

## Decisão de domínio (NOWVI-5 e NOWVI-29)

**Recomendação: um domínio global com subpasta por idioma (`nowvi.net/pt-br/`, `/en/`, `/es/`,
`/id/`...), e o `nowvi.com.br` fazendo 301 para `nowvi.net/pt-br/`, caminho a caminho.**

| Opção | Prós | Contras |
|---|---|---|
| **Subpasta num gTLD** (escolhida) | Toda a autoridade (backlinks e histórico) soma num domínio só. É fácil de manter e funciona com um deploy e um Search Console. É o modelo dos líderes (ssstik.io/de, snaptik.app/en). | O sinal de país vem só do `hreflang`. |
| `.com.br` (BR) + global (resto) | O `.com.br` passa confiança no Brasil e tem geotarget claro. | A autoridade se divide em dois domínios que começam do zero. Exige `hreflang` entre domínios e dois Search Consoles. |
| ccTLD por país | Geotarget máximo. | É caro, cada domínio atende um só país e a autoridade se divide em 10 ([Google](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)). Fora de questão para um time de uma pessoa. |

- **Por que `nowvi.net`:** é o nome exato da marca, o que importa para a entidade nos LLMs e no
  Knowledge Graph. O `getnowvi.com` quebra o nome. O `.io` o Google trata como genérico (está na lista de
  ccTLDs genéricos, na mesma fonte), mas carrega o risco de governança do território de Chagos.
  Registre `nowvi.io` e `getnowvi.com` como defensivos, com 301 para o `.net`.
- **Por que manter o `.com.br`:** é a marca na rua, no Pix e no e-mail (`contato@nowvi.com.br`), e
  protege contra squatter. Ele faz 301 para `/pt-br/`, então não divide autoridade. Como nada está
  indexado ainda, a migração hoje custa zero, e daqui a 6 meses custaria posição.
- **`/` = `x-default`** (inglês), sem redirect por IP ou `Accept-Language`, que o Google desaconselha
  (mesma fonte). Quem decide o idioma é o `hreflang`.
- **Risco:** o `nowvi.com` tem outro dono. Monitore se ele vira site com outro produto (confusão de
  entidade) e, se der, compre-o mais tarde.
- Combine o prefixo com o agent do i18n. Se ele já fixou `/` = pt-BR, o resto vale igual, e só o
  `x-default` muda.

## Ordem de entrada nos mercados

Já em andamento: pt-BR, en, es e id (NOWVI-28). As Filipinas ficam com o `en`: o tráfego de
downloader de lá chega por keyword em inglês (ver `keywords.md`).

| Locale | Alcance do TikTok (M, 18+) [W] | Demanda de downloader | CPM | Ordem |
|---|---|---|---|---|
| **th** | 34 | savetik.co: TH é o 1º país, com 13,15% [SW-savetik]; snaptik.app: 4,97% [SW-snaptik] e 4,6% do orgânico [A-snaptik] | pop US$ 6,04, o maior da lista [R]; social TH Android US$ 2,1 / iOS US$ 3,3 [AD] | **1** |
| **vi** | 40,9 | savetik.co: VN = 8,13% [SW-savetik] | pop US$ 2,17 [R]; social VN iOS US$ 3,2 [AD] | **2** |
| **tr** | 40,2 | savefrom.net: TR = 6,64% = **11,28 M visitas/mês** [S-savefrom]; ssstwitter: 4,57% = 1,76 M [S-ssstwitter]; ssstik: 3,5% do orgânico = 1,1 M [A-ssstik] | pop US$ 0,59, o menor [R]; Adsterra: não encontrado | **3**: volume, receita baixa |
| fil | 62,3 | snaptik: PH = 5,87% = 2,45 M [S-snaptik], 11,9% do orgânico [A-snaptik]; ttdownloader: 8,15% [S-ttd] | pop US$ 3,45 [R]; social PH Android US$ 1,7 [AD] | coberto pelo `en` |
| **de** | 21,8 | não encontrado no top 5 de nenhum downloader medido | social DE Windows US$ 28,2, nicho Android US$ 2,1 [AD]; pop US$ 3,16 [R] | **4** |
| **fr** | 21,5 | não encontrado | social FR Windows US$ 4,9 [AD]; pop US$ 1,89 [R] | **5** |
| **it** | 19,8 | não encontrado | pop US$ 2,22 [R]; Adsterra: não encontrado | **6** |
| pl | 11,4 | o `pl.savefrom.net` existe [SW-savefrom-pl]; share não encontrado | nicho PL Android US$ 2,6 [AD]; pop não encontrado | 7, só com sinal no Search Console |
| ja | 26,9 | não encontrado | social JP Windows US$ 21,8 [AD]; pop US$ 1,53 [R] | 8, só com sinal |
| ko | 7,2 | não encontrado; busca dominada pelo Naver | nicho KR Android US$ 2,6 / iOS US$ 2,4 [AD] | 9, só com sinal |

Por que essa ordem difere do NOWVI-28 (de, fr, it, tr, vi...):
1. O tráfego de downloader é celular. O tiktokdownloader.com tem 99,15% de visitas mobile
   (abril de 2026) [S-tiktokdownloader], então os CPMs altos de **Windows** (DE US$ 28,2, JP US$ 21,8) quase não se
   aplicam. Pelo CPM de celular e de pop, a Tailândia lidera.
2. Tailândia, Vietnã e Turquia aparecem no top 5 de país dos downloaders medidos. Alemanha, França,
   Itália, Japão e Coreia não aparecem em nenhum deles.
3. A Turquia entra pelo volume (11,28 M de visitas/mês só no savefrom), mas com o pior CPM. A
   tradução é barata, e o retorno vem de escala, não de receita por mil.

Ressalvas: o CPM pop da Remoby é ao vivo de 24 h e o da Adsterra é o melhor caso por SO, e o Nowvi
vende banner, não pop, então use os números só para comparar países. O alcance [W] é o público de
anúncio do TikTok, não o total de usuários. As shares do Similarweb são de desktop.

## Arquitetura de conteúdo

Cluster = **rede × intenção × idioma**, com uma landing forte por cluster (hub) e filhas que
respondem a uma intenção concreta.

```
/<locale>/                                  home (todas as redes)
/<locale>/<slug-tiktok>                     hub TikTok: "sem marca d'água" no H1
    /iphone                                 Safari > Downloads > Fotos; atalho do Arquivos
    /pc                                     Chrome/Edge no Windows e Mac; onde o arquivo cai
    /whatsapp                               H.264 compatível (flag do NOWVI-25), status e conversa
/<locale>/<slug-tiktok-mp3>                 só quando o NOWVI-23 existir
/<locale>/<alternativa-snaptik>             comparação honesta: preço, anúncio, qualidade, privacidade
/<locale>/<slug-x>, /<slug-facebook>        hubs, ganham filhas só se o GSC mostrar demanda
/<locale>/sobre                             entidade: quem faz, o que guarda, contato
```

- **Filha só com conteúdo próprio:** passos com print do sistema certo, erro comum daquele aparelho
  e uma FAQ própria. Página que só troca "iPhone" por "PC" é doorway e leva penalidade
  ([Google, spam policies](https://developers.google.com/search/docs/essentials/spam-policies#doorways)).
- **Toda filha tem o downloader no topo.** A intenção é transacional mesmo no "como baixar".
- **Linkagem interna:**
  - o hub linka todas as filhas, num bloco "Em outro aparelho";
  - cada filha linka o hub e as irmãs;
  - todas as páginas linkam os outros hubs de rede (o bloco que já existe em `download-page.tsx:47-67`);
  - há breadcrumb visível e em `BreadcrumbList`;
  - a âncora é a keyword da página de destino, nunca "clique aqui".
- **Texto citável:** cada FAQ abre com uma frase que responde sozinha ("O Nowvi baixa vídeos
  públicos do TikTok sem marca d'água, em MP4, até 720p grátis."). É o formato que o LLM copia.
- **Ordem de produção:** pt-BR, en, es e id primeiro, nos mesmos 3 spokes do TikTok, e depois os
  locales novos, já com o cluster completo.

## Fase 1: dias 0–30, fundação

Esforço: P < 1 dia, M de 1 a 3 dias, G > 3 dias. O impacto é a estimativa em relação à meta do épico.

| Item | Card | Esforço | Impacto | KPI |
|---|---|---|---|---|
| Registrar `nowvi.com.br`, `nowvi.net` e os defensivos | SEO-01 (NOWVI-5, NOWVI-29) | P | bloqueante | domínio resolve; DNS no Cloudflare |
| Domínio no build, 301 do host do Railway e validação do `SITE_URL` | SEO-02 | P | bloqueante | 100% dos canonicals, sitemaps e `og:url` no domínio final |
| Search Console (propriedade de domínio + uma de prefixo por locale), Bing Webmaster (importar do GSC) e IndexNow | SEO-10 | P | alto | sitemap "Sucesso"; 100% das URLs indexadas em 14 dias |
| FAQ renderizado no servidor (`<details>`) | SEO-03 | P | alto (GEO) | todas as respostas no HTML sem JS |
| `hreflang` + `x-default` no metadata e no sitemap; `lang` e `og:locale` por locale | SEO-05 | M | alto | 0 erros de hreflang (GSC, Bing e validador) |
| JSON-LD da entidade (`Organization`, `WebSite`, `@id`, `sameAs`), `BreadcrumbList`, `offers` e `inLanguage` por locale | SEO-06 | M | alto | Rich Results Test sem erro; nenhum BRL fora do pt-BR |
| `llms.txt` dinâmico por locale e `llms-full.txt` | SEO-11 | P | alto (GEO) | `/llms.txt` e `/<locale>/llms.txt` = 200, com URLs do domínio final |
| Dieta de JS (`zod/mini` e `next/dynamic` no pós-info) | SEO-07 | M | médio | JS < 180 KB gzip; chunk do app < 35 KB gzip |
| Medição de CWV em campo + Lighthouse CI no PR | SEO-04 | P | médio | p75 a 375 px: LCP < 2,5 s, INP < 200 ms, CLS < 0,1 ([web.dev](https://web.dev/articles/vitals)) |
| OG por locale e landing, com dimensões | SEO-09 | P | baixo-médio | `og:image:width/height/alt` em 100% das páginas |
| Validar volumes no Keyword Planner ou no Ahrefs | SEO-12 | P | médio | `keywords.md` com "não encontrado" < 30% em pt-BR, en, es e id |
| Higiene (`poweredByHeader`, HSTS, `lastModified`) | SEO-26 | P | baixo | headers conferidos com `curl` |
| Diretórios de ferramenta (AlternativeTo, SaaSHub) | SEO-22 | P | médio | 3 perfis publicados com o mesmo nome, descrição e logo |

## Fase 2: dias 30–60, conteúdo e GEO

| Item | Card | Esforço | Impacto | KPI |
|---|---|---|---|---|
| Cluster "como baixar" do TikTok: iPhone, PC e WhatsApp em pt-BR, en, es e id | SEO-13 | G | alto | 12 páginas indexadas; top 20 em ≥ 50% das keywords I de `keywords.md` |
| Páginas de alternativa honesta (Snaptik/SSSTik) em pt-BR, en e id | SEO-14 | M | alto (navegacional) | impressões em "snaptik", "ssstik" e "alternativa" |
| Página "Sobre" e consistência de entidade | SEO-15 | P | médio (GEO) | mesma descrição de 1 frase em site, `llms.txt`, diretórios e JSON-LD |
| Cloudflare na frente do web: brotli, cache do HTML e Crawler Hints (IndexNow) | SEO-08 | M | médio | TTFB p75 < 600 ms na Ásia e na Europa (CrUX ou RUM) |
| Locale **th** | SEO-17 | M | alto | páginas th indexadas; impressões TH > 0 em 14 dias |
| Locale **vi** | SEO-18 | M | alto | idem para VN |
| Repo público no GitHub + diretórios de MCP (depende do NOWVI-12) | SEO-23 | M | médio (GEO) | listado no Registry oficial e em ≥ 3 diretórios |
| Lançamento no Product Hunt | SEO-22 | P | médio | página publicada; link para o domínio |
| Ritual quinzenal e painel de KPIs | SEO-28 | P | médio | painel com os KPIs abaixo, atualizado a cada 2 semanas |
| Monitor de citação por LLM | SEO-29 | P | médio | planilha com 10 prompts × 4 LLMs × locale, uma rodada por mês |

## Fase 3: dias 60–90, expansão e autoridade

| Item | Card | Esforço | Impacto | KPI |
|---|---|---|---|---|
| Locale **tr** | SEO-19 | M | médio | impressões TR; top 20 em "tiktok video indir filigransız" |
| Locales **de**, **fr** e **it** | SEO-20 | G | médio | páginas indexadas; impressões por país |
| Outreach para listas "best TikTok downloader" e blogs de criadores | SEO-25 | M | alto | ≥ 10 domínios de referência novos e editoriais |
| Presença no Reddit e em comunidades, sem spam | SEO-24 | P contínuo | médio (GEO) | ≥ 5 respostas úteis por mês, com disclosure |
| Gate de pl, ja e ko pelo sinal do GSC | SEO-21 | P | baixo | decisão registrada, com números |
| Análise de logs de crawl | SEO-27 | P | médio | hits de Googlebot, Bingbot, GPTBot, ClaudeBot e PerplexityBot por locale/semana |
| Rever o 302 do Instagram (NOWVI-20) | SEO-30 | P | médio | decisão: 410, landing de aviso ou volta |

## GEO: ser citado por LLM

- **`llms.txt` por locale** ([llmstxt.org](https://llmstxt.org/)):
  - `/llms.txt` em inglês, com o resumo e links para `/pt-br/llms.txt`, `/es/llms.txt` etc.;
  - cada um com H1 "Nowvi", um blockquote de uma frase, preço, limites e as URLs do locale;
  - um `llms-full.txt` com as FAQs inteiras;
  - tudo gerado do mesmo dicionário das páginas, sem texto duplicado à mão.
- **Robots aberto:** já está (`robots.ts`). Mantenha os bots de treino liberados, porque é o que faz o
  modelo conhecer a marca sem busca.
- **Entidade consistente:** o nome é sempre "Nowvi", nunca "NowVi" ou "Nowvi App". Vale também para:
  - a descrição de uma frase, igual (traduzida) no site, no `llms.txt`, no JSON-LD, no GitHub, no
    Product Hunt e no AlternativeTo;
  - o logo, que é o mesmo SVG em todos esses lugares;
  - o `Organization.sameAs`, que lista todos os perfis.
  
  A página "Sobre" diz em uma frase que o Nowvi não tem relação com o `nowvi.com`.
- **Fatos citáveis:** números em frase curta ("até 720p grátis depois de 30 s de anúncio"; "nenhum
  vídeo fica salvo no servidor"; "aceita links de tiktok.com, vm.tiktok.com, x.com, twitter.com,
  facebook.com e fb.watch"). Cada página mostra "Atualizado em <data>".
- **Onde os LLMs leem:**
  - **Reddit:** responda só em threads que pedem ferramenta, com disclosure ("eu faço o Nowvi"),
    respeite a regra de cada subreddit e não crie conta-fantoche. O Google tem acordo de dados com o
    Reddit desde 2024.
  - **GitHub:** um repo público (por exemplo, o cliente do MCP com README, a descrição da entidade e
    o link). O README é texto que entra em dataset de treino.
  - **Diretórios de MCP** (com o NOWVI-12): o Registry oficial (`registry.modelcontextprotocol.io`),
    Smithery, Glama, mcp.so e PulseMCP, todos com a mesma descrição.
  - **Listas comparativas:** artigos "best TikTok downloader 2026" e "snaptik alternatives" são o
    que o LLM com busca abre primeiro. Ver Off-page.
- **Medir:** o mesmo conjunto de 10 prompts por locale ("como baixar vídeo do TikTok sem marca
  d'água", "best tiktok downloader no watermark", "alternativa ao snaptik"...) no ChatGPT, no
  Perplexity, no Gemini e no Claude, uma vez por mês. O KPI é em quantos dos 40 o Nowvi aparece (SEO-29).

## Off-page: backlinks legítimos

Sem compra de link, sem troca de link em massa, sem PBN e sem comentário com link
([Google, link spam](https://developers.google.com/search/docs/essentials/spam-policies#link-spam)).
Publieditorial pago só com `rel="sponsored"`, e não conta como SEO.

Checklist executável:
1. **Diretórios de ferramenta:**
   - AlternativeTo, listado como alternativa a SnapTik, SSSTik e SaveFrom, com a descrição fiel;
   - SaaSHub;
   - BetaList (antes do Product Hunt);
   - a página de produto no Indie Hackers.
2. **Product Hunt:** lance quando o en estiver no ar, com o domínio final. Prepare 5 prints, o vídeo
   de 30 s e a primeira resposta do maker.
3. **Listas "best TikTok downloader":**
   - levante, por locale, os 20 primeiros artigos da SERP dessas buscas;
   - mande ao autor um e-mail curto com os fatos (sem marca d'água, sem cadastro, nada salvo, preço)
     e um print;
   - peça a inclusão só se o Nowvi for de fato melhor em algum critério.
4. **Blogs e canais de criadores:** ofereça um tutorial de "como repostar com crédito" (o termo de
   uso já pede autorização) e, quando o NOWVI-2 sair, créditos de Full HD para o autor testar. Nunca
   peça link em troca de crédito.
5. **Show HN / Indie Hackers:** um post técnico (yt-dlp em Rust, token HMAC, nada em disco). Link
   editorial de domínio técnico, uma vez só.
6. **GitHub:** o repo do SEO-23, que dá backlink e citação.
7. **Imprensa BR:** Tecnoblog, TecMundo e Canaltech publicam "como baixar vídeo do TikTok". Mande
   uma pauta, sem pagar.

## Medição

**Configuração (SEO-10):**
- **Search Console:**
  - propriedade de **domínio** (TXT no DNS), que cobre todos os locales;
  - uma propriedade de **prefixo** por locale (`/pt-br/`, `/en/`, `/es/`, `/id/`...), para ter
    relatório por idioma;
  - envio do `sitemap.xml`;
  - acesso para `emerson_jdss@hotmail.com`.
- **Bing Webmaster:**
  - importa do Search Console (o mesmo sitemap);
  - liga o IndexNow: chave em `/<key>.txt` na raiz e ping no deploy. O Bing, o Naver, o Seznam, o
    Yandex e o Yep usam IndexNow; o Google não ([indexnow.org](https://www.indexnow.org/faq)). O
    Crawler Hints do Cloudflare faz o ping sozinho.
- **Naver Search Advisor:** só se o `ko` passar no gate.
- **Logs de crawl:**
  - log do Railway ou do Cloudflare filtrado por UA de bot, com o Googlebot conferido por DNS reverso;
  - relatório de "Estatísticas de rastreamento" do Search Console.

**KPIs por locale:**
- URLs indexadas sobre as enviadas;
- impressões e cliques por semana;
- CTR;
- posição média das 5 keywords T de `keywords.md`;
- % de URLs "Boas" no relatório de CWV;
- domínios de referência;
- citações em LLM (de 40 prompts).

Downloads por locale exigem gravar o locale no `downloads`, uma mudança de API para outro card,
quando o painel pedir.

**A cada 2 semanas (SEO-28):**
1. Search Console: cobertura (erros novos, "Rastreada, não indexada"), hreflang, CWV e as consultas
   novas com impressão e sem página dedicada, que viram backlog de conteúdo.
2. Bing: indexação e erros do IndexNow.
3. A posição das 5 keywords T por locale, com a variação.
4. Os logs: o volume de bot por locale e se algum locale novo ainda não foi rastreado.
5. Backlinks novos e perdidos, pelo Ahrefs Webmaster Tools, que é grátis para site verificado.
6. Uma linha de decisão no card do épico.

## Fontes

- [W] World Population Review / DataReportal, alcance de anúncio do TikTok 18+: https://worldpopulationreview.com/country-rankings/tiktok-users-by-country e https://datareportal.com/essential-tiktok-stats
- [S-savefrom] https://www.semrush.com/website/savefrom.net/overview/ (setembro de 2026)
- [S-snaptik] https://www.semrush.com/website/snaptik.app/overview/
- [S-ssstwitter] https://www.semrush.com/website/ssstwitter.com/overview/
- [S-ssstik] https://www.semrush.com/website/ssstik.io/overview/
- [S-snapinsta] https://www.semrush.com/website/snapinsta.com.br/overview/
- [S-ttd] https://www.semrush.com/website/ttdownloader.com/overview/
- [S-tiktokdownloader] https://www.semrush.com/website/tiktokdownloader.com/overview/
- [A-ssstik] https://ahrefstop.com/websites/ssstik.io (outubro de 2026)
- [A-snaptik] https://ahrefstop.com/websites/snaptik.app
- [SW-snaptik] https://www.similarweb.com/website/snaptik.app/ (junho de 2026, desktop)
- [SW-savetik] https://www.similarweb.com/website/savetik.co/
- [SW-savefrom-pl] https://www.similarweb.com/website/pl.savefrom.net/
- [AD] Adsterra, CPM por país e SO (2026-09-08): https://adsterra.com/blog/geos-with-high-cpm-rates-for-publishers/
- [R] Remoby, eCPM de pop das últimas 24 h (2026-10-30): https://remoby.com/traffic-chart/
- Google, sites multirregionais: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Google, versões localizadas (hreflang): https://developers.google.com/search/docs/specialty/international/localized-versions
- Google, HowTo e FAQ (2023): https://developers.google.com/search/blog/2023/08/howto-faq-changes
- TikTok, download oficial com marca d'água: https://www.tiktok.com/download-video/en
