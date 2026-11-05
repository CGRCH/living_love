"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/products/?page_size=50`)
      .then((r) => r.json())
      .then((d) => setProducts(d.results ?? d));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Productos</h1>
      <p className="mt-2 text-sm text-taupe">Edición completa vía API admin y Django admin.</p>
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
        {products.map((p: Parameters<typeof ProductCard>[0]["product"]) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
