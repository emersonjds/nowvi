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
  `npm run check`, `npx tsc --noEmit` e `npm run build`.
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
| growth | sonnet | recomendação de SEO, GEO, ads e copy |

## Exceção da v0

A v0 sai sem testes, por pedido do Emerson em 2026-10-29. O NOWVI-15 traz TDD e cobertura acima de 90%
antes da próxima feature.
