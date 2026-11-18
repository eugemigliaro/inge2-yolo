#!/usr/bin/env bash
# Regenera los SVG de docs/diagramas a partir de los .mmd, y el PDF del white paper.
# Con SOLO_PDF=1 se saltea los diagramas y no hace falta Docker.
# El navegador se puede forzar con CHROME=/ruta/al/binario.
set -euo pipefail
cd "$(dirname "$0")"
if [[ "${SOLO_PDF:-0}" != 1 ]]; then
  for f in diagramas/*.mmd; do
    docker run --rm -u "$(id -u):$(id -g)" -v "$PWD/diagramas:/data" minlag/mermaid-cli:12.0.0 \
      -i "/data/$(basename "$f")" -o "/data/$(basename "${f%.mmd}").svg" -b white
  done
fi
CHROME=${CHROME:-$(command -v google-chrome || command -v chromium || echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")}
pandoc white-paper.md -s --embed-resources --css white-paper.css -o white-paper.html
"$CHROME" --headless=new --no-pdf-header-footer --print-to-pdf=white-paper.pdf white-paper.html 2>/dev/null
rm white-paper.html
