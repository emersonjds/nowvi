# Cards de SEO e GEO para o santi (NOWVI-36)

Prontos para `santi issues create NOWVI`. O número `SEO-nn` é provisório e sai quando o santi
atribuir o `NOWVI-<n>`. Os cards já existentes ficam ligados, não duplicados (NOWVI-5, 12, 20, 23,
25, 26, 29). O SEO-16 (subsets de fonte) foi absorvido pelos cards de locale (SEO-18 a SEO-20). Prioridade: Urgent > High > Medium > Low. A fase segue `roadmap.md`.

Todo card que mexe em `apps/web` segue a regra do agent `web`: FSD, dicionário por locale,
375 px primeiro e CSP intacta. O aceite técnico se confere com `curl` contra a produção.

## Fase 1 (dias 0–30)

### SEO-01: Registrar `nowvi.com.br`, `nowvi.net` e os defensivos
- Tipo: Task. Prioridade: **Urgent**. Liga: NOWVI-5, NOWVI-29.
- Aceite:
  - `nowvi.com.br`, `nowvi.net`, `nowvi.io` e `getnowvi.com` registrados no nome do Emerson;
  - DNS de todos no Cloudflare;
  - MX do `nowvi.com.br` ativo e `contato@nowvi.com.br` recebendo;
  - a decisão de domínio do `roadmap.md` registrada no NOWVI-29.

### SEO-02: Domínio final no build e 301 do host do Railway
- Tipo: Task. Prioridade: **Urgent**. Depende de: SEO-01.
- Aceite:
  - `NEXT_PUBLIC_SITE_URL` = domínio final no Railway;
  - o build de produção falha se o `SITE_URL` não for `https://`, ou se for `localhost` ou `*.up.railway.app`;
  - `curl -I https://web-production-41797e.up.railway.app/baixar-video-tiktok` → 301 para o domínio final, no mesmo caminho;
  - `nowvi.com.br/*` → 301 para `nowvi.net/pt-br/*`, e os defensivos → 301 para o `.net`;
  - canonical, `og:url`, `sitemap.xml` e `Sitemap:` do robots com o domínio final em 100% das páginas.

### SEO-03: FAQ renderizado no servidor
- Tipo: Bug. Prioridade: **High**. Auditoria: P0-3.
- Aceite:
  - o `curl` de qualquer landing contém o texto de todas as respostas do FAQ fora de `<script>`;
  - o FAQ usa `<details>`/`<summary>`, sem Radix Accordion;
  - o JSON-LD `FAQPage` bate 1:1 com o texto visível;
  - o alvo de toque continua com ≥ 44 px.

### SEO-04: Core Web Vitals em campo e Lighthouse CI
- Tipo: Task. Prioridade: High.
- Aceite:
  - o Lighthouse CI roda no PR (mobile, 375 px) e falha com LCP > 2,5 s, TBT > 200 ms ou CLS > 0,1;
  - o relatório de CWV do Search Console está monitorado;
  - a linha de base de LCP, INP e CLS (p75) por template está registrada no card.

### SEO-05: `hreflang` + `x-default` no metadata e no sitemap
- Tipo: Story. Prioridade: **High**. Auditoria: P1-4 e P1-5. É critério de aceite do i18n (NOWVI-28).
- Aceite:
  - toda página emite `<link rel="alternate" hreflang>` para todos os locales e `x-default`, recíproco;
  - o `sitemap.xml` tem `xhtml:link` com as mesmas alternates;
  - `<html lang>` e `og:locale` corretos por locale, e `og:locale:alternate` para os outros;
  - 0 erros no validador de hreflang e no Search Console.

### SEO-06: JSON-LD da entidade, `BreadcrumbList` e ofertas por locale
- Tipo: Story. Prioridade: **High**. Auditoria: P1-6, P1-7 e P2-19.
- Aceite:
  - `Organization` (`@id`, `name`, `url`, `logo`, `sameAs`) e `WebSite` no layout;
  - o `WebApplication.publisher` aponta para o `@id`;
  - `BreadcrumbList` em toda landing;
  - o `inLanguage` vem do locale, e nenhuma `Offer` em BRL nem de Full HD fora do pt-BR;
  - o `HowToStep.text` difere do `name`;
  - o Rich Results Test e o validator.schema.org passam sem erro.

### SEO-07: Dieta de JS
- Tipo: Task. Prioridade: High. Auditoria: P1-8.
- Aceite:
  - `zod/mini` no `lib/api.ts`;
  - `PixSheet`, `WaitingPanel`, `QualityOptions` e `AdSlot` via `next/dynamic`;
  - JS do primeiro load < 180 KB gzip e chunk do app < 35 KB gzip, medido no build;
  - o fluxo colar → info → espera → download funciona igual em 375 px.

### SEO-09: OG por locale e por landing, com dimensões
- Tipo: Task. Prioridade: Medium. Auditoria: P1-10 e P1-11.
- Aceite:
  - toda página emite `og:image`, `og:image:width=1200`, `og:image:height=630`, `og:image:alt` e `twitter:image`;
  - o texto da imagem vem do dicionário do locale e usa o H1 da landing;
  - a prévia está conferida no debugger do Facebook e no do X.

### SEO-10: Search Console, Bing Webmaster e IndexNow
- Tipo: Task. Prioridade: **High**. Depende de: SEO-02.
- Aceite:
  - propriedade de domínio no Search Console (TXT) e uma propriedade de prefixo por locale;
  - sitemap enviado e com status "Sucesso";
  - Bing Webmaster importado do Search Console;
  - a chave do IndexNow em `/<key>.txt`, com ping a cada deploy, ou pelo Crawler Hints do SEO-08;
  - 100% das URLs do sitemap indexadas em até 14 dias, ou o motivo registrado.

### SEO-11: `llms.txt` dinâmico por locale e `llms-full.txt`
- Tipo: Story. Prioridade: **High**. Auditoria: P0-2.
- Aceite:
  - `/llms.txt` (en, com links para cada locale) e `/<locale>/llms.txt` gerados por route handler, a partir de `APP_CONFIG.url` e do dicionário;
  - `/llms-full.txt` com as FAQs inteiras;
  - nenhuma URL hardcoded, e o `public/llms.txt` removido;
  - formato do llmstxt.org: H1, blockquote, seções H2 com links.

### SEO-12: Validar os volumes de keyword
- Tipo: Task. Prioridade: Medium.
- Aceite:
  - `keywords.md` atualizado com o Keyword Planner ou o Ahrefs, com fonte e data, para pt-BR, en, es e id;
  - "não encontrado" < 30% nesses quatro;
  - os slugs do NOWVI-28 revistos se a keyword nº 1 mudar.

### SEO-22: Diretórios de ferramenta e Product Hunt
- Tipo: Task. Prioridade: Medium. Depende de: SEO-02 e SEO-15.
- Aceite:
  - perfis publicados no AlternativeTo (como alternativa a SnapTik, SSSTik e SaveFrom), no SaaSHub e no BetaList;
  - o lançamento no Product Hunt feito com o `en` no ar;
  - em todos, o mesmo nome, a mesma descrição de 1 frase, o mesmo logo e o domínio final;
  - as URLs dos perfis adicionadas ao `Organization.sameAs`.

### SEO-26: Higiene de headers e sitemap
- Tipo: Task. Prioridade: Low. Auditoria: P2-13, P2-14, P2-16 e P2-17.
- Aceite:
  - `poweredByHeader: false`;
  - HSTS com `max-age=63072000; includeSubDomains`;
  - `lastModified` no sitemap;
  - `keywords` removido do metadata;
  - tudo conferido com `curl -I`.

## Fase 2 (dias 30–60)

### SEO-08: Cloudflare na frente do web
- Tipo: Task. Prioridade: Medium. Liga: NOWVI-26. Auditoria: P1-9.
- Aceite:
  - proxy do Cloudflare ativo no domínio final;
  - brotli ativo;
  - o HTML estático em cache na borda (`cf-cache-status: HIT` na 2ª requisição);
  - Crawler Hints ligado;
  - a CSP e os security headers intactos;
  - TTFB p75 < 600 ms medido em SG e em DE.

### SEO-13: Cluster "como baixar" do TikTok (iPhone, PC e WhatsApp)
- Tipo: Story. Prioridade: **High**. Liga: NOWVI-25.
- Aceite:
  - 3 filhas do hub do TikTok (`/iphone`, `/pc`, `/whatsapp`) em pt-BR, en, es e id, ou seja, 12 páginas;
  - cada uma com o downloader no topo, passos próprios do sistema (com print), uma FAQ própria de ≥ 3 perguntas e "Atualizado em";
  - breadcrumb visível e em `BreadcrumbList`;
  - linkagem hub ↔ filhas ↔ irmãs com âncora de keyword;
  - todas no sitemap com alternates;
  - nenhuma página com mais de 50% de texto igual a outra.

### SEO-14: Página de alternativa honesta (Snaptik/SSSTik)
- Tipo: Story. Prioridade: Medium.
- Aceite:
  - páginas em pt-BR, en e id com uma tabela factual (preço, anúncio, qualidade máxima, cadastro, o que guarda) e a data da checagem;
  - sem logo nem marca do concorrente como se fosse do Nowvi;
  - nenhuma afirmação sem fonte;
  - title no padrão "Alternativa ao Snaptik sem cadastro | Nowvi".

### SEO-15: Página "Sobre" e consistência de entidade
- Tipo: Story. Prioridade: Medium.
- Aceite:
  - a página `/<locale>/sobre` diz quem faz, o que o Nowvi guarda e não guarda, o contato e uma frase dizendo que não tem relação com o `nowvi.com`;
  - a descrição de 1 frase é idêntica (traduzida) em site, `llms.txt`, JSON-LD, GitHub e diretórios;
  - o link para a página está no rodapé.

### SEO-17: Locale `th`
- Tipo: Story. Prioridade: **High**. Depende de: SEO-05 e SEO-13.
- Aceite:
  - home e hubs (TikTok, X, Facebook) mais o cluster do TikTok em tailandês nativo, com keyword levantada em `keywords.md`, sem tradução literal;
  - fonte do sistema para o tailandês conferida a 375 px;
  - hreflang `th` em todas as páginas;
  - `/th/llms.txt`;
  - impressões de TH no Search Console em ≤ 14 dias.

### SEO-18: Locale `vi`
- Tipo: Story. Prioridade: **High**. Depende de: SEO-05 e SEO-13.
- Aceite: os mesmos do SEO-17, com o subset `vietnamese` da fonte (auditoria P1-12) e as keywords
  de `keywords.md`.

### SEO-23: Repo público no GitHub e diretórios de MCP
- Tipo: Task. Prioridade: Medium. Liga: NOWVI-12.
- Aceite:
  - repo público com README (descrição da entidade, link, uso do MCP) e licença;
  - o servidor MCP publicado no Registry oficial e em ≥ 3 diretórios (Smithery, Glama, mcp.so ou PulseMCP), com a mesma descrição;
  - as URLs no `sameAs`.

### SEO-28: Ritual quinzenal e painel de KPIs
- Tipo: Task. Prioridade: Medium.
- Aceite:
  - painel (Looker Studio sobre o Search Console, ou planilha) com, por locale: indexadas/enviadas, impressões, cliques, CTR, posição das 5 keywords T, % de CWV bom, domínios de referência e citações em LLM;
  - o checklist de 6 passos do `roadmap.md` rodado a cada 2 semanas, com uma linha de decisão no épico.

### SEO-29: Monitor de citação por LLM
- Tipo: Task. Prioridade: Medium.
- Aceite:
  - 10 prompts fixos por locale ativo, rodados no ChatGPT, no Perplexity, no Gemini e no Claude uma vez por mês;
  - a planilha registra se o Nowvi aparece, a posição, a URL citada e o concorrente citado;
  - a primeira rodada é a linha de base.

## Fase 3 (dias 60–90)

### SEO-19: Locale `tr`
- Tipo: Story. Prioridade: Medium. Depende de: SEO-05 e SEO-13.
- Aceite: os mesmos do SEO-17, com o subset `latin-ext` e as keywords turcas de `keywords.md`.

### SEO-20: Locales `de`, `fr` e `it`
- Tipo: Story. Prioridade: Medium. Depende de: SEO-05 e SEO-13.
- Aceite:
  - as mesmas regras do SEO-17 para cada locale, com `latin-ext`;
  - a copy escrita por nativo ou revisada por um, sem tradução literal;
  - as keywords validadas no SEO-12 antes de publicar.

### SEO-21: Gate de `pl`, `ja` e `ko`
- Tipo: Task. Prioridade: Low.
- Aceite:
  - decisão registrada com os números do Search Console (impressões por país das páginas `en` em 60 dias) e do CPM;
  - se entrar `ko`, o Naver Search Advisor configurado.

### SEO-24: Reddit e comunidades
- Tipo: Task. Prioridade: Low.
- Aceite:
  - uma conta real com disclosure ("eu faço o Nowvi");
  - ≥ 5 respostas por mês em threads que pedem ferramenta, dentro da regra de cada subreddit;
  - nenhum post só com link;
  - um log com as URLs das respostas.

### SEO-25: Outreach para listas e blogs de criadores
- Tipo: Task. Prioridade: **High**.
- Aceite:
  - lista dos 20 primeiros artigos "best TikTok downloader" e "como baixar vídeo do TikTok" em pt-BR, en, es e id;
  - um e-mail factual para cada autor;
  - ≥ 10 domínios de referência editoriais novos em 30 dias;
  - nenhum link pago nem trocado (o que for pago leva `rel="sponsored"`).

### SEO-27: Logs de crawl por bot e locale
- Tipo: Task. Prioridade: Medium. Depende de: SEO-08.
- Aceite:
  - um relatório semanal com os hits de Googlebot (verificado por DNS reverso), Bingbot, GPTBot, OAI-SearchBot, ClaudeBot e PerplexityBot por locale;
  - alerta quando um locale novo não é rastreado em 7 dias.

### SEO-30: Rever o 302 do Instagram
- Tipo: Task. Prioridade: Medium. Liga: NOWVI-20. Auditoria: P2-15.
- Aceite:
  - no D+60, a decisão registrada: voltar a landing (se o NOWVI-20 resolveu), uma landing com aviso e lista de espera, ou 410;
  - sem 302 permanente.

## Os 5 de maior impacto

1. **SEO-01 + SEO-02**: sem domínio nada é indexado, e hoje o canonical aponta para o Railway.
2. **SEO-05**: o hreflang é o que faz os 4 idiomas somarem em vez de competir.
3. **SEO-13**: o cluster "como baixar" é a cauda longa onde um domínio novo chega ao top 10 em 90 dias.
4. **SEO-03 + SEO-11**: a resposta citável no HTML e o `llms.txt` vivo são a base do GEO, por menos de um dia de trabalho.
5. **SEO-25**: backlinks editoriais de listas "best downloader" decidem as keywords de cabeça.
