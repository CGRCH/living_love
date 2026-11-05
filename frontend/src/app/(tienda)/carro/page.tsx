"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL, formatCLP, mediaUrl } from "@/lib/api";
import { DEMO_PRODUCT_IMAGES } from "@/lib/demo-images";
import { Button } from "@/components/ui/Button";

type CartItem = {
  id: number;
  product: { name: string; slug: string; images?: { image: string }[] };
  unit_price: number;
  qty: number;
  line_total: number;
  options_summary?: string[];
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const session = () => localStorage.getItem("ll_cart_session") || "";

  const load = () => {
    fetch(`${API_URL}/api/cart/`, { headers: { "X-Cart-Session": session() } })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        if (data.session_key) {
          localStorage.setItem("ll_cart_session", data.session_key);
        }
      });
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (id: number, qty: number) => {
    setBusyId(id);
    await fetch(`${API_URL}/api/cart/items/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Cart-Session": session() },
      body: JSON.stringify({ qty }),
    });
    load();
    setBusyId(null);
  };

  const removeItem = async (id: number) => {
    setBusyId(id);
    await fetch(`${API_URL}/api/cart/items/${id}/`, {
      method: "DELETE",
      headers: { "X-Cart-Session": session() },
    });
    load();
    setBusyId(null);
  };

  const subtotal = items.reduce((a, i) => a + i.line_total, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">Carro</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-taupe">Tu carro está vacío.</p>
      ) : (
        <ul className="mt-8 divide-y divide-arena/40">
          {items.map((item) => {
            const thumb =
              mediaUrl(item.product.images?.[0]?.image) ||
              DEMO_PRODUCT_IMAGES[item.product.slug] ||
              null;
            return (
              <li key={item.id} className="flex gap-4 py-6 text-sm">
                <div className="h-20 w-20 shrink-0 bg-marfil">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/producto/${item.product.slug}`} className="font-serif text-lg">
                    {item.product.name}
                  </Link>
                  {item.options_summary?.length ? (
                    <p className="mt-1 text-xs text-taupe">{item.options_summary.join(" · ")}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-label text-taupe">
                      Cant.
                      <select
                        className="border border-arena px-2 py-1 text-sm normal-case"
                        value={item.qty}
                        disabled={busyId === item.id}
                        onChange={(e) => updateQty(item.id, Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="text-xs underline text-taupe"
                      disabled={busyId === item.id}
                      onClick={() => removeItem(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <span className="shrink-0">{formatCLP(item.line_total)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-8 flex items-center justify-between border-t border-arena pt-6">
        <span className="font-serif text-xl">Subtotal</span>
        <span>{formatCLP(subtotal)}</span>
      </div>
      <Link href="/checkout" className="mt-8 block">
        <Button full disabled={!items.length}>
          Finalizar compra
        </Button>
      </Link>
    </div>
  );
}
