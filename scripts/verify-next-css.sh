#!/usr/bin/env bash
set -euo pipefail
BASE="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
for _ in $(seq 1 45); do
  HTML=$(curl -sf "$BASE/" || true)
  if [[ -n "$HTML" ]]; then
    CSS_PATH=$(echo "$HTML" | grep -oE '/_next/static/css/[a-f0-9]+\.css' | head -1 || true)
    if [[ -n "$CSS_PATH" ]] && curl -sf "$BASE$CSS_PATH" | grep -q '\.bg-onix'; then
      echo "Next.js CSS OK: $CSS_PATH"
      exit 0
    fi
  fi
  sleep 2
done
echo "Next.js CSS no responde en $BASE (¿next start desactualizado tras build?)" >&2
exit 1
