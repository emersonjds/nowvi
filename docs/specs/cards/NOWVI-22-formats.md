# NOWVI-22: escolha de qualidade

Referência: ssstwitter.com/pt, que mostra pelo menos 3 qualidades de MP4 por vídeo. A pessoa
escolhe a qualidade antes de baixar.

## Regras
- Grátis: toda qualidade com lado menor **≤ 720**, depois da espera do anúncio.
- Pago (Full HD): lado menor **≥ 1080**. A lista mostra a opção com R$ 2 e o botão do Pix, e o
  link de download só sai no NOWVI-2.
- Só entram formatos **progressivos**, com vídeo e áudio no mesmo arquivo (`vcodec != none` e
  `acodec != none`). Formato que exige merge fica para o NOWVI-13, porque a imagem não tem ffmpeg.
  Exceção: se a rede não informa o `acodec` (vem `null`, como em alguns formatos do X), o formato
  entra.
- Um formato por qualidade (lado menor). Para desempatar: H.264 (`avc*` ou `h264`) primeiro,
  depois `mp4`, depois o maior `tbr`.
- No máximo 4 qualidades grátis. A lista vai da maior para a menor qualidade, e as qualidades
  acima de 1080 são agrupadas como "Full HD".
- MP3 fica fora (NOWVI-23).

## Contrato (aditivo; `free` continua para compatibilidade)

`POST /api/info` ganha `formats`:
```json
"formats": [
  { "quality": "1080p", "height": 1080, "ext": "mp4", "filesize_bytes": 41000000, "tier": "full_hd", "token": null },
  { "quality": "720p",  "height": 720,  "ext": "mp4", "filesize_bytes": 18400000, "tier": "free", "token": "..." },
  { "quality": "480p",  "height": 480,  "ext": "mp4", "filesize_bytes": 9100000,  "tier": "free", "token": "..." },
  { "quality": "360p",  "height": 360,  "ext": "mp4", "filesize_bytes": null,     "tier": "free", "token": "..." }
]
```
- `height` é o lado menor do vídeo. `quality` = `"<height>p"`.
- `tier` vale `"free"` ou `"full_hd"`. No `full_hd`, `token` vem sempre `null`.
- Todos os tokens grátis têm o mesmo `nbf` e o mesmo `exp`, então `free.wait_seconds` e
  `free.expires_in_seconds` valem para todos.
- `free` = o primeiro item `tier: "free"` (a maior qualidade grátis). Se não houver nenhum formato
  grátis, o info responde `404 not_found`, como hoje.
- `full_hd_available` = existe algum item com `tier: "full_hd"`.

O token ganha a claim `"q": "<height>p"`. O `downloads.quality` grava esse valor em vez do fixo
`"720p"`.

## Web
- O card "Grátis" vira uma lista de opções, uma linha por qualidade grátis: rótulo ("720p HD",
  "480p", "360p"), tamanho quando houver e um radio. A maior vem marcada. O botão "Baixar grátis
  (<qualidade>)" usa o token da qualidade escolhida.
- O card "Full HD" mostra a qualidade paga mais alta ("1080p Full HD") e só aparece quando existe.
- A espera e a tela "Seu vídeo está sendo baixado" mostram a qualidade escolhida. Nessa tela entra
  o link "Baixar em outra qualidade", que volta para a lista sem refazer o `/api/info`, desde que
  o token não tenha expirado.
- Rótulo "HD" a partir de 720 e "Full HD" a partir de 1080.
