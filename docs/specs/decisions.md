# Decisões

Registro do painel de decisão (veja `.claude/CLAUDE.md`). Cada entrada tem a pergunta, os votos, o vencedor, o trade-off e os critérios de aceite.

## D-1: Enviar no WhatsApp (NOWVI-25), 2026-10-30

**Pergunta:** como o vídeo chega ao WhatsApp com o menor número de toques, sem pesar no celular nem
no egress.

**Votos**
- `ux`: Web Share API Level 2 (`navigator.share({ files })`), com prefetch do blob assim que a
  fase vira `ready`. Isso cabe na ativação por gesto e dá um toque só. No computador, o botão vira
  "Compartilhar link" e abre `wa.me` com o link do Nowvi. Vai o melhor H.264 até 720p, com teto de
  50 MB. O botão é secundário, abaixo do "Baixar agora". Nenhum concorrente anexa o arquivo na
  folha nativa: o fluxo deles é manual, então isso é diferencial real.
- `architect` (sessão principal): prefetch para todo mundo dobraria o egress do Railway, que já
  leva cerca de 25% da receita (NOWVI-26). O blob baixado precisa servir também para o "Baixar
  agora", para o vídeo trafegar uma vez só.

**Vencedor**
1. **Celular com `navigator.canShare({ files })`, quando a qualidade escolhida é H.264 e tem até
   50 MB** (tamanho conhecido, ou desconhecido com corte por contagem de bytes no stream):
   - na fase `ready`, um único `fetch` traz o blob;
   - o "Baixar agora" salva esse blob por `URL.createObjectURL` + `<a download>`, sem segundo
     request;
   - o "Enviar no WhatsApp" compartilha o mesmo blob, com um toque.
2. **Qualidade escolhida sem H.264, mas existindo outro H.264 até 720p:** o botão vira "Preparar
   <q>p para WhatsApp". O primeiro toque baixa esse formato e o segundo toque ("Enviar no
   WhatsApp") abre a folha. Não há prefetch, para não pagar egress de quem não compartilha.
3. **Sem H.264, ou acima de 50 MB:** o botão não aparece.
4. **Computador** (sem `canShare({ files })`, mas com `window.open`): o botão "Compartilhar link"
   abre `https://wa.me/?text=` com o texto e o link do Nowvi no idioma da página.

**Trade-off:** o prefetch de 1 cobra egress de quem estava no `ready` e desistiu. O desperdício
ficou limitado a celular com H.264 de até 50 MB, e quem baixa não paga de novo.

**Critérios de aceite**
- `waiting`: sem botão.
- `ready`, blob em voo: "Preparando envio…" desabilitado, com `aria-live`.
- `ready`, blob pronto: "Enviar no WhatsApp" habilitado. Um toque abre a folha. Se a pessoa
  cancelar, não aparece erro.
- Falha do fetch (rede, 303 para `?erro=` ou resposta que não é vídeo): "Não deu, baixe e envie",
  e o "Baixar agora" volta ao link direto.
- `downloading`: o botão continua, abaixo de "Baixar em outra qualidade".
- Copy nos 4 idiomas, no dicionário.
- 375px, alvo de 44px. O CTA accent continua sendo só o "Baixar agora".

## D-2: Detalhes de SEO do pacote rápido (NOWVI-36), 2026-10-30

Proposta do agent `seo`, revisada pela sessão principal. Não houve voto do `ux`, porque nada aqui
muda tela ou fluxo.
- **Fonte:** o preload fica só no subset `latin`. O next/font já emite o `@font-face` de
  `latin-ext`, `vietnamese` e `cyrillic-ext` com `unicode-range` e `display: swap`. O preload extra
  custaria cerca de 30 KB por página sem ganho em pt, en, es e id. Revisite quando entrar `vi`.
- **`llms.txt`:** gerado por rota a partir dos dicionários e do `APP_CONFIG.url`, e servido com
  `X-Robots-Tag: noindex`. Os bots de LLM leem o arquivo direto, e o Google não o lista como
  página.
- **Sitemap:** `lastModified` é a constante `CONTENT_UPDATED_AT`, atualizada à mão junto com os
  dicionários. Nunca muda por build, para não sinalizar mudança falsa.
- **JSON-LD da entidade** (`Organization` e `WebSite`): fica no template `DownloadPage`, usado por
  todas as páginas, e não no layout. O HTML sai igual e o JSON-LD continua coberto por teste.
- **Pendente do domínio (SEO-01 e SEO-02):** o `noindex` no host `*.up.railway.app`, o Rich
  Results Test e os debuggers de OG.
