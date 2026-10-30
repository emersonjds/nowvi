#!/bin/sh
# Stands in for yt-dlp in the download tests: `-f <mode>:<pidfile>` picks what it prints.
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-f" ]; then format="$2"; fi
  shift
done
echo "$$" > "${format#*:}"
case "${format%%:*}" in
  complete) printf 'nowvi-video-bytes' ;;
  flood) exec yes nowvi ;;
  drip) while :; do printf 'x'; sleep 0.2; done ;;
esac
