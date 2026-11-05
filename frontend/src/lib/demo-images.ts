/** Rutas estáticas en `public/demo/` (sin hotlinks externos). */

export const DEMO_HERO = "/demo/hero.jpg";
export const DEMO_LIFESTYLE = "/demo/lifestyle-workshop.jpg";
export const DEMO_TESTIMONIAL = "/demo/testimonial.jpg";

export const DEMO_PRODUCT_IMAGES: Record<string, string> = {
  "sofa-nube-boucle": "/demo/products/sofa-nube-boucle.jpg",
  "seccional-andes": "/demo/products/seccional-andes.jpg",
  "sofa-valparaiso": "/demo/products/sofa-valparaiso.jpg",
  "chesterfield-oliva": "/demo/products/chesterfield-oliva.jpg",
  "cojin-boucle-marfil": "/demo/products/cojin-boucle-marfil.jpg",
  "cierre-pvc-quincho": "/demo/products/cierre-pvc-quincho.jpg",
  "toldo-retractil": "/demo/products/toldo-retractil.jpg",
  "quitasol-3x3": "/demo/products/quitasol-3x3.jpg",
};

export const DEMO_CATEGORY_IMAGES: Record<string, string> = {
  livings: "/demo/categories/livings.jpg",
  cojines: "/demo/categories/cojines.jpg",
  "cortinas-pvc": "/demo/categories/cortinas-pvc.jpg",
  toldos: "/demo/categories/toldos.jpg",
  quitasoles: "/demo/categories/quitasoles.jpg",
};

export const DEFAULT_CATEGORY_IMAGE = "/demo/categories/default.jpg";

export const DEMO_INSTAGRAM_TILES = [
  "/demo/instagram/01.jpg",
  "/demo/instagram/02.jpg",
  "/demo/instagram/03.jpg",
  "/demo/instagram/04.jpg",
  "/demo/instagram/05.jpg",
  "/demo/instagram/06.jpg",
];

export function categoryImageForSlug(slug: string) {
  return DEMO_CATEGORY_IMAGES[slug] ?? DEFAULT_CATEGORY_IMAGE;
}
