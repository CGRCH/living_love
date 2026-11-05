import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { categoryImageForSlug } from "@/lib/demo-images";
import { ProductCard } from "@/components/catalog/ProductCard";

const labels: Record<string, string> = {
  livings: "Livings & sofás",
  cojines: "Cojines",
  "cortinas-pvc": "Cortinas PVC",
  toldos: "Toldos",
  quitasoles: "Quitasoles",
};

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categories = await fetchCategories();
  const list = Array.isArray(categories) ? categories : categories.results ?? [];
  if (!list.some((c: { slug: string }) => c.slug === params.slug)) {
    notFound();
  }
  const products = await fetchProducts({ category: params.slug });
  const title = labels[params.slug] || params.slug;

  return (
    <div>
      <section
        className="relative flex min-h-[220px] items-center justify-center bg-grafito text-blanco"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('${categoryImageForSlug(params.slug)}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-label text-arena">
            Inicio / {title}
          </p>
          <h1 className="mt-2 font-serif text-4xl capitalize">{title}</h1>
          <p className="mt-2 text-sm text-arena">{products.length} modelos · Fabricados a tu medida</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-label">Filtrar</p>
          <p className="mt-6 text-[10px] uppercase tracking-label text-taupe">Categoría</p>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(labels).map(([slug, label]) => (
              <li key={slug}>
                <Link
                  href={`/categoria/${slug}`}
                  className={slug === params.slug ? "font-medium text-onix" : "text-taupe"}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div>
          <div className="mb-8 flex items-center justify-between text-sm text-taupe">
            <span>Mostrando {products.length} productos</span>
            <span className="text-[10px] uppercase tracking-label">Ordenar: Destacados</span>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {products.map((p: Parameters<typeof ProductCard>[0]["product"]) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
