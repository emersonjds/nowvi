#!/bin/sh
# Stands in for yt-dlp in the tests.
# Probe (`-J`): the URL's last path segment picks the reply, by default `probe-<segment>.json`.
# Download: `-f <mode>:<pidfile>` picks what it prints.
for arg in "$@"; do url="$arg"; done
while [ "$#" -gt 0 ]; do
  case "$1" in
    -J) probe=yes ;;
    -f) format="$2" ;;
  esac
  shift
done
if [ "$probe" = yes ]; then
  case "${url##*/}" in
    private) echo 'ERROR: [TikTok] 1: This post is Private' >&2; exit 1 ;;
    broken) echo 'ERROR: [TikTok] 1: Unable to extract webpage video data' >&2; exit 1 ;;
    hang) exec sleep 60 ;;
    notjson) echo 'nowvi' ;;
    flood) exec yes nowvi ;;
    *) exec cat "$(dirname "$0")/probe-${url##*/}.json" ;;
  esac
  exit
fi
echo "$$" > "${format#*:}"
case "${format%%:*}" in
  complete) printf 'nowvi-video-bytes' ;;
  flood) exec yes nowvi ;;
  drip) while :; do printf 'x'; sleep 0.2; done ;;
esac
