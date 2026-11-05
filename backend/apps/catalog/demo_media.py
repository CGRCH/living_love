"""Rutas de imagen demo servidas por Next.js (`public/demo/`)."""

PRODUCT_SLUGS = [
    "sofa-nube-boucle",
    "seccional-andes",
    "sofa-valparaiso",
    "chesterfield-oliva",
    "cojin-boucle-marfil",
    "cierre-pvc-quincho",
    "toldo-retractil",
    "quitasol-3x3",
]

DEMO_PRODUCT_IMAGES = {slug: f"/demo/products/{slug}.jpg" for slug in PRODUCT_SLUGS}

DEMO_CATEGORY_IMAGES = {
    "livings": "/demo/categories/livings.jpg",
    "cojines": "/demo/categories/cojines.jpg",
    "cortinas-pvc": "/demo/categories/cortinas-pvc.jpg",
    "toldos": "/demo/categories/toldos.jpg",
    "quitasoles": "/demo/categories/quitasoles.jpg",
}
