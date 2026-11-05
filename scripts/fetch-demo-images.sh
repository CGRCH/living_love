#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
D="$ROOT/frontend/public/demo"
mkdir -p "$D/products" "$D/categories" "$D/instagram"

fetch() {
  curl -fsSL "$1" -o "$2"
}

A="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=85"
B="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=85"
C="https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=85"
D1="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85"
E="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85"

fetch "$A" "$D/hero.jpg"
fetch "$B" "$D/lifestyle-workshop.jpg"
fetch "$E" "$D/testimonial.jpg"

fetch "$B" "$D/products/sofa-nube-boucle.jpg"
fetch "$C" "$D/products/seccional-andes.jpg"
fetch "$B" "$D/products/sofa-valparaiso.jpg"
fetch "$C" "$D/products/chesterfield-oliva.jpg"
fetch "$A" "$D/products/cojin-boucle-marfil.jpg"
fetch "$D1" "$D/products/cierre-pvc-quincho.jpg"
fetch "$D1" "$D/products/toldo-retractil.jpg"
fetch "$D1" "$D/products/quitasol-3x3.jpg"

fetch "$B" "$D/categories/livings.jpg"
fetch "$A" "$D/categories/cojines.jpg"
fetch "$D1" "$D/categories/cortinas-pvc.jpg"
fetch "$D1" "$D/categories/toldos.jpg"
fetch "$D1" "$D/categories/quitasoles.jpg"
fetch "$A" "$D/categories/default.jpg"

fetch "$A" "$D/instagram/01.jpg"
fetch "$B" "$D/instagram/02.jpg"
fetch "$C" "$D/instagram/03.jpg"
fetch "$D1" "$D/instagram/04.jpg"
fetch "$C" "$D/instagram/05.jpg"
fetch "$E" "$D/instagram/06.jpg"

echo "Demo images ready ($(find "$D" -type f | wc -l) files)"
