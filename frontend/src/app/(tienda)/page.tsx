import Link from "next/link";
import { fetchHome } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/catalog/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let home;
  try {
    home = await fetchHome();
  } catch {
    home = { sections: [], categories: [], featured_products: [], testimonials: [] };
  }
  const hero = home.sections?.find((s: { section: string }) => s.section === "hero");

  return (
    <>
      <section className="relative min-h-[620px] bg-grafito text-blanco lg:min-h-[90vh]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=80')",
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col justify-end px-4 pb-20 pt-32 lg:px-8">
          <p className="text-[10px] uppercase tracking-label text-champ">Hecho a mano en Santiago</p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-6xl">
            El <em>living</em> que siempre <em>soñaste</em>
          </h1>
          <p className="mt-4 max-w-lg text-sm text-arena">
            {hero?.subtitle ||
              "Bouclé, lino y terciopelo, a tu medida. Despacho gratis en Santiago."}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/categoria/livings">
              <Button>Comprar ahora</Button>
            </Link>
            <Link href="/cotizar">
              <Button variant="outline" className="border-blanco text-blanco hover:bg-blanco hover:text-onix">
                Cotizar a medida
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-onix py-20 text-blanco">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-serif text-3xl">Compra por categoría</h2>
            <Link href="/categoria/livings" className="text-[10px] uppercase tracking-label text-champ">
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            {home.categories?.map((cat: { slug: string; name: string }, i: number) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="group relative aspect-[3/5] overflow-hidden bg-grafito"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-${1616486338812 + i}-3dadae4b4ace?w=600&q=70')`,
                  }}
                />
                <span className="absolute bottom-6 left-3 origin-bottom-left -rotate-90 text-[10px] uppercase tracking-label">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-marfil py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="font-serif text-3xl text-onix">Últimas colecciones</h2>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {home.featured_products?.map((p: Parameters<typeof ProductCard>[0]["product"]) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/categoria/livings">
              <Button variant="outline">Ver colección completa</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div
          className="min-h-[420px] bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555041469-a586c167ea46?w=1200&q=80')",
          }}
        />
        <div className="flex flex-col justify-center bg-blanco px-8 py-16 lg:px-16">
          <h2 className="font-serif text-3xl">Tu tela, tu medida, tu estilo.</h2>
          <p className="mt-4 text-sm leading-relaxed text-taupe">
            Más de 40 telas premium, medidas a tu espacio y fabricación en 15–20 días hábiles en
            nuestro taller en Santiago.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/categoria/livings">
              <Button>Configurar mi living</Button>
            </Link>
            <Link href="/categoria/livings" className="self-center text-sm uppercase tracking-label">
              Ver telas
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-arena/30 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 text-center md:grid-cols-4 lg:px-8">
          {[
            ["Despacho gratis", "En Región Metropolitana"],
            ["Devoluciones", "Consulte política vigente"],
            ["WhatsApp", "Lunes a sábado 9–19 hrs"],
            ["Pago flexible", "Webpay, Mercado Pago, Flow y SumUp"],
          ].map(([t, s]) => (
            <div key={t}>
              <p className="text-[10px] uppercase tracking-label text-onix">{t}</p>
              <p className="mt-2 text-sm text-taupe">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-onix py-20 text-blanco">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="font-serif text-3xl">Lo que dicen nuestros clientes</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {home.testimonials?.slice(0, 3).map(
              (t: { id: number; name: string; text: string; location?: string }) => (
                <blockquote key={t.id} className="border border-grafito p-6 text-sm text-arena">
                  <p>{t.text}</p>
                  <footer className="mt-4 font-serif text-champ">— {t.name}</footer>
                </blockquote>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}
