import Link from "next/link";
import { fetchHome } from "@/lib/api";
import { DEFAULT_CATEGORY_IMAGE, DEMO_CATEGORY_IMAGES } from "@/lib/demo-images";
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
            {home.categories?.map((cat: { slug: string; name: string }) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="group relative aspect-[3/5] overflow-hidden bg-grafito"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${DEMO_CATEGORY_IMAGES[cat.slug] ?? DEFAULT_CATEGORY_IMAGE}')`,
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

      <section className="bg-marfil py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-onix">@livinglove.cl</h2>
            <p className="text-[10px] uppercase tracking-label text-taupe">Síguenos en Instagram</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 md:gap-3">
            {[
              "photo-1616486338812-3dadae4b4ace",
              "photo-1555041469-a586c167ea46",
              "photo-1493663284031-b7e3aefcae5e",
              "photo-1586023492125-27b2c045efd7",
              "photo-1567016432779-094069958ea5",
              "photo-1631889992176-79e40c2b3160",
            ].map((id) => (
              <div
                key={id}
                className="aspect-square bg-grafito bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/${id}?w=400&q=70')` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-onix text-blanco">
        {home.testimonials?.[0] ? (
          <div className="relative min-h-[520px] md:min-h-[560px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-onix via-onix/70 to-onix/30" />
            <blockquote className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 lg:px-8 md:min-h-[560px]">
              <p className="max-w-3xl font-serif text-2xl leading-snug md:text-4xl">
                “{home.testimonials[0].text}”
              </p>
              <footer className="mt-6 text-sm text-champ">
                — {home.testimonials[0].name}
                {home.testimonials[0].location ? `, ${home.testimonials[0].location}` : ""}
              </footer>
            </blockquote>
          </div>
        ) : null}
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h2 className="font-serif text-3xl">Más opiniones</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {home.testimonials?.slice(1, 3).map(
              (t: { id: number; name: string; text: string; location?: string }) => (
                <blockquote key={t.id} className="border border-grafito p-6 text-sm text-arena">
                  <p>{t.text}</p>
                  <footer className="mt-4 font-serif text-champ">
                    — {t.name}
                    {t.location ? `, ${t.location}` : ""}
                  </footer>
                </blockquote>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}
