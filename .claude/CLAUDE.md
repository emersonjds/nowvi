# nowvi

Site de uma página em pt-BR para baixar vídeos de Instagram, TikTok, X e Facebook. O grátis vai até
720p depois de 30 s de anúncio, e o Full HD custa R$ 2 no Pix.
Spec da v0: `docs/specs/2026-10-29-nowvi-v0-design.md`. Design: `design/` (export do Stitch, MCP
`stitch` em escopo local).

## Backlog no santi

- Os cards ficam no projeto `NOWVI` do santi: `santi backlog NOWVI` e `santi issues create|edit|move NOWVI-<n>`.
- Tudo o que for construído tem card. Lacuna achada no meio do trabalho também vira card.
- O card vai para In Progress quando a branch nasce e para Done depois do merge na `developer`,
  com um comentário dizendo o que saiu e o que ficou para outro card.
- A branch carrega o card: `feat|fix|chore|docs/NOWVI-<n>-<resumo>`.

## Layout

- `apps/web`: Next 16 sobre o next-shadcn-admin-dashboard, com npm. Leia `apps/web/AGENTS.md`. Comandos: `npm run dev`,
  `npm run check`, `npx tsc --noEmit`, `npm run test:coverage` e `npm run build`.
- `crates/nowvi-api`: axum + sqlx + Postgres, que chama o `yt-dlp`, com um slice por feature.
  Comandos: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` e `cargo build`.
- O contrato entre os dois é a seção "Contrato da API" da spec. Nunca importe de um app no outro.

## Fluxo do card

`architect` → `backend` / `web` em paralelo quando o contrato já existe → `devops` → `qa` quando o
card toca segurança, contrato, dinheiro ou passa de ~200 linhas → merge `--no-ff` na `developer` →
PR para a `main`. O Railway faz o deploy a partir da `main`.

## Agents

| Agent | Modelo | Entrega |
|---|---|---|
| architect | opus | spec e plano |
| backend | opus | `crates/nowvi-api` |
| web | opus | `apps/web` |
| devops | opus | Docker, Railway e CI |
| qa | opus | revisão adversarial, só leitura |
| growth | sonnet | pesquisa de mercado, ads e copy (recomendação) |
| ux | sonnet | crítica de UX e UI, voto no painel e revisão de screenshot |
| seo | opus | SEO técnico, GEO e conteúdo por idioma em `apps/web`, roadmap em `docs/specs/seo/` |

## Painel de decisão

Toda decisão de produto, UX, arquitetura ou segurança passa por um painel antes do código.
- Votam, **um por vez** (sem paralelismo, para economizar token): `architect` (dados, performance
  e arquitetura), `ux` (fluxo, tela e copy), `seo` ou `growth` (busca e mercado) e `qa`
  (segurança, quando o tema toca nela).
- Cada voto entra em `docs/specs/decisions.md` como `D-<n>`, com a pergunta, o voto de cada
  agent, o vencedor, o trade-off e os critérios de aceite.
- A sessão principal desempata pelo melhor para o usuário final, com performance extrema.
- Quem implementa não decide UX sozinho: uma dúvida aberta no meio do build volta ao painel.

## Legibilidade

- Variável, função, tipo e arquivo têm nome semântico do domínio (`downloadToken`, `pickFormats`, `ErrorCode`), nunca `a`, `b`, `x`, `data`, `item`, `tmp`, `found` ou abreviação. Isso vale para parâmetro de callback também: `(left, right)`, não `(a, b)`.
- Qualquer pessoa, de estagiária a staff engineer, entende uma função em 10 segundos. Se não entende, quebre a função em partes com nome.
- Comentário segue a regra do CLAUDE.md global: só fato que o código não mostra (restrição externa, quirk de biblioteca ou rede, decisão de time). Rationale vai para `docs/specs/`.
- `.lagune/hooks/` é código de terceiro, gerado pelo `npx lagune`. Não é revisado nem editado.

## Exceção da v0

A v0 saiu sem testes, por pedido do Emerson em 2026-10-29. A web tem testes desde o NOWVI-34 (Vitest, Testing
Library e MSW contra o contrato, cobertura travada em 90%). A API segue sem testes até o NOWVI-15.
