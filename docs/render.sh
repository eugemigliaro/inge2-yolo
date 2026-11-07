#!/usr/bin/env bash
# Regenera los SVG de docs/diagramas a partir de los .mmd, y el PDF del white paper.
set -euo pipefail
cd "$(dirname "$0")"
for f in diagramas/*.mmd; do
  docker run --rm -u "$(id -u):$(id -g)" -v "$PWD/diagramas:/data" minlag/mermaid-cli:12.0.0 \
    -i "/data/$(basename "$f")" -o "/data/$(basename "${f%.mmd}").svg" -b white
done
pandoc white-paper.md -s --toc --toc-depth=2 --embed-resources --css white-paper.css -o white-paper.html --metadata lang=es --metadata toc-title=Índice
google-chrome --headless=new --no-pdf-header-footer --print-to-pdf=white-paper.pdf white-paper.html 2>/dev/null
rm white-paper.html
