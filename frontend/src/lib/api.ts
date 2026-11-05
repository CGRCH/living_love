const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type PublicSettings = {
  announcement_text: string;
  whatsapp: string;
  instagram: string;
  free_shipping_text: string;
  return_policy_md: string;
  warranty_text: string;
  trust_return_text: string;
  boleta_enabled: boolean;
  factura_enabled: boolean;
  payment_providers: { code: string; display_name: string }[];
  fabrication_notice: string;
};

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const res = await fetch(`${API_URL}/api/settings/public/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("settings");
  return res.json();
}

export async function fetchHome() {
  const res = await fetch(`${API_URL}/api/home/`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("home");
  return res.json();
}

export async function fetchProducts(params?: Record<string, string>) {
  const q = new URLSearchParams(params);
  const res = await fetch(`${API_URL}/api/products/?${q}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("products");
  const data = await res.json();
  return data.results ?? data;
}

export async function fetchProduct(slug: string) {
  const res = await fetch(`${API_URL}/api/products/${slug}/`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("product");
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_URL}/api/categories/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("categories");
  return res.json();
}

export async function fetchRegions() {
  const res = await fetch(`${API_URL}/api/regions/`, { cache: "no-store" });
  return res.json();
}

export async function fetchCommunes(regionId: number) {
  const res = await fetch(`${API_URL}/api/communes/?region=${regionId}`, { cache: "no-store" });
  return res.json();
}

export function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/demo/")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export { API_URL };
