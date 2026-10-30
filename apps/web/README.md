# Nowvi web

One page em Next 16 que baixa vídeos de Instagram, TikTok, X e Facebook pela `nowvi-api`.
Spec: `docs/specs/2026-10-29-nowvi-v0-design.md`.

## Comandos

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # biome
npx tsc --noEmit
npm run build        # exige NEXT_PUBLIC_API_URL e NEXT_PUBLIC_SITE_URL
node .next/standalone/server.js   # depois de copiar .next/static para .next/standalone/.next
```

## Envs

| Nome | Obrigatória | Uso |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | no build | origem da `nowvi-api`, também entra no `connect-src` da CSP |
| `NEXT_PUBLIC_SITE_URL` | no build | URL pública do site, base do `metadataBase` |
| `NEXT_PUBLIC_ADSTERRA_BANNER_KEY` | não | key do banner 300x250. Sem ela, ou sem consentimento, entra o anúncio da casa |
