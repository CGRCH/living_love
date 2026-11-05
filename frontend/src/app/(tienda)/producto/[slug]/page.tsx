"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_URL, mediaUrl } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge, PriceTag } from "@/components/ui/PriceTag";

type OptionValue = {
  id: number;
  label: string;
  swatch_hex?: string;
  price_delta: number;
  triggers_quote?: boolean;
};
type OptionGroup = {
  id: number;
  name: string;
  type: string;
  values: OptionValue[];
};

type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  base_price: number;
  compare_at_price?: number;
  price_mode: string;
  requires_deposit: boolean;
  lead_time_text: string;
  images: { image: string; alt: string }[];
  option_groups: OptionGroup[];
};

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selection, setSelection] = useState<Record<number, number | number[]>>({});
  const [unitPrice, setUnitPrice] = useState(0);
  const [triggersQuote, setTriggersQuote] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/products/${params.slug}/`)
      .then((r) => r.json())
      .then((p: Product) => {
        setProduct(p);
        const initial: Record<number, number> = {};
        p.option_groups?.forEach((g) => {
          if (g.values[0]) initial[g.id] = g.values[0].id;
        });
        setSelection(initial);
        setUnitPrice(p.base_price);
      });
  }, [params.slug]);

  useEffect(() => {
    if (!product) return;
    const options: Record<string, number | number[]> = {};
    product.option_groups.forEach((g) => {
      if (selection[g.id] !== undefined) options[String(g.id)] = selection[g.id];
    });
    fetch(`${API_URL}/api/products/calculate-price/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, options }),
    })
      .then((r) => r.json())
      .then((data) => {
        setUnitPrice(data.unit_price);
        setTriggersQuote(data.triggers_quote);
      });
  }, [product, selection]);

  const quoteOnly = product?.price_mode === "quote_only";

  const whatsappMsg = useMemo(() => {
    if (!product) return "";
    return encodeURIComponent(
      `Hola Living Love, me interesa ${product.name}. Opciones: ${JSON.stringify(selection)}`,
    );
  }, [product, selection]);

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-20">Cargando…</div>;
  }

  const mainImage = mediaUrl(product.images?.[0]?.image);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <p className="text-[10px] uppercase tracking-label text-taupe">
        <Link href="/">Inicio</Link> / Livings / {product.name}
      </p>
      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-square bg-marfil">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-taupe">Imagen demo</div>
          )}
          <Badge className="absolute left-4 top-4 bg-onix text-blanco">Hecho a medida</Badge>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-label text-champ">Colección</p>
          <h1 className="font-serif text-4xl">{product.name}</h1>
          {!quoteOnly && !triggersQuote && (
            <div className="mt-4">
              <PriceTag price={unitPrice} compareAt={product.compare_at_price} />
              <p className="mt-2 text-xs text-taupe">
                o 6 cuotas sin interés · {product.lead_time_text}
              </p>
            </div>
          )}
          {(quoteOnly || triggersQuote) && (
            <p className="mt-4 text-sm text-champ">Esta configuración requiere cotización personalizada.</p>
          )}

          {product.option_groups.map((group, idx) => (
            <div key={group.id} className="mt-8 border-t border-arena/50 pt-6">
              <p className="text-[10px] uppercase tracking-label">
                {idx + 1}. {group.name}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.values.map((val) => {
                  const selected = selection[group.id] === val.id;
                  if (group.name.toLowerCase() === "tela" && val.swatch_hex) {
                    return (
                      <button
                        key={val.id}
                        type="button"
                        aria-label={val.label}
                        onClick={() => setSelection((s) => ({ ...s, [group.id]: val.id }))}
                        className={`h-8 w-8 rounded-full border-2 ${selected ? "border-onix" : "border-arena"}`}
                        style={{ backgroundColor: val.swatch_hex }}
                      />
                    );
                  }
                  return (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => setSelection((s) => ({ ...s, [group.id]: val.id }))}
                      className={`border px-3 py-2 text-xs ${selected ? "border-onix bg-onix text-blanco" : "border-arena text-onix"}`}
                    >
                      {val.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-10 flex flex-wrap gap-4">
            {quoteOnly || triggersQuote ? (
              <>
                <Link href={`/cotizar?producto=${product.slug}`}>
                  <Button>Solicitar cotización</Button>
                </Link>
                <a href={`https://wa.me/56932222939?text=${whatsappMsg}`} target="_blank" rel="noreferrer">
                  <Button variant="outline">WhatsApp</Button>
                </a>
              </>
            ) : (
              <Button
                onClick={async () => {
                  const session = localStorage.getItem("ll_cart_session") || crypto.randomUUID();
                  localStorage.setItem("ll_cart_session", session);
                  const options: Record<string, number> = {};
                  Object.entries(selection).forEach(([k, v]) => {
                    options[k] = v as number;
                  });
                  await fetch(`${API_URL}/api/cart/items/`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Cart-Session": session,
                    },
                    body: JSON.stringify({
                      product_id: product.id,
                      options,
                      qty: 1,
                    }),
                  });
                  window.location.href = "/carro";
                }}
              >
                Agregar al carro
              </Button>
            )}
          </div>
          {product.requires_deposit && (
            <p className="mt-4 text-xs text-taupe">
              Producto a medida: se solicita abono del 50% al finalizar la compra.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
