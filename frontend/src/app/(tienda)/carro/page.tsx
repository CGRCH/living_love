"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL, formatCLP } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type CartItem = {
  id: number;
  product: { name: string; slug: string };
  unit_price: number;
  qty: number;
  line_total: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  const load = () => {
    const session = localStorage.getItem("ll_cart_session") || "";
    fetch(`${API_URL}/api/cart/`, { headers: { "X-Cart-Session": session } })
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

  const subtotal = items.reduce((a, i) => a + i.line_total, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">Carro</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-taupe">Tu carro está vacío.</p>
      ) : (
        <ul className="mt-8 divide-y divide-arena/40">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between py-6 text-sm">
              <div>
                <Link href={`/producto/${item.product.slug}`} className="font-serif text-lg">
                  {item.product.name}
                </Link>
                <p className="text-taupe">Cantidad: {item.qty}</p>
              </div>
              <span>{formatCLP(item.line_total)}</span>
            </li>
          ))}
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
