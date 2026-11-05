import { notFound } from "next/navigation";
import { ProductClient } from "./ProductClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const res = await fetch(`${API_URL}/api/products/${params.slug}/`, { cache: "no-store" });
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`product_fetch_${res.status}`);
  }
  const product = await res.json();
  return <ProductClient product={product} />;
}
