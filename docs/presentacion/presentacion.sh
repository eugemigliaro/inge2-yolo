#!/usr/bin/env bash
# Diapositivas animadas de la defensa (Manim + manim-slides).
#   ./presentacion.sh render [l|m|h]      renderiza: l 480p15, m 720p30, h 1080p60 (por defecto)
#   ./presentacion.sh presentar [-S N]      presenta en la pantalla N: → / espacio / clicker avanza, ← vuelve, Q sale
#   ./presentacion.sh pantallas             lista los números de pantalla que usa -S
#   ./presentacion.sh exportar              defensa.html (un solo archivo, sin conexión) y defensa-animada.pptx
set -euo pipefail
cd "$(dirname "$0")"
ESCENAS=(S01Portada S02Problema S03Funcionalidades S04Decision S05Arquitectura S06Recursos S07Demo
         S08Preguntas S09Comparativa S10PERT S11Atributos S12Despliegue S13Limites)
case "${1:-}" in
  render)
    # Una escena por proceso, cada una con su propio media/ para que no compitan por la caché.
    printf '%s\n' "${ESCENAS[@]}" |
      xargs -P "$(nproc)" -I{} manim-slides render --quality="${2:-h}" --media_dir "media/{}" defensa.py {}
    ;;
  presentar) manim-slides present --full-screen "${ESCENAS[@]}" "${@:2}" ;;
  pantallas)
    "$(dirname "$(readlink -f "$(command -v manim-slides)")")/python" -c '
from PySide6.QtWidgets import QApplication
app = QApplication([])
for i, s in enumerate(app.screens()):
    g = s.geometry(); print(f"{i}: {s.name()} {g.width()}x{g.height()}")' ;;
  exportar)
    manim-slides convert --to html --one-file --offline -cprogress=true "${ESCENAS[@]}" defensa.html
    manim-slides convert --to pptx "${ESCENAS[@]}" defensa-animada.pptx
    ;;
  *) sed -n '2,6p' "$0"; exit 1 ;;
esac
