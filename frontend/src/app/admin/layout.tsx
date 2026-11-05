"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["", "Resumen"],
  ["pedidos", "Pedidos"],
  ["cotizaciones", "Cotizaciones"],
  ["productos", "Productos"],
  ["pagos", "Pagos"],
  ["ajustes", "Ajustes"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ll_admin_token");
    if (!token && !pathname.endsWith("/login")) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready && !pathname.endsWith("/login")) return null;

  if (pathname.endsWith("/login")) {
    return <div className="min-h-screen bg-marfil">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-marfil">
      <aside className="w-64 shrink-0 bg-onix p-6 text-blanco">
        <p className="font-serif text-xl">LIVING LOVE</p>
        <p className="text-[10px] uppercase tracking-label text-champ">Panel administración</p>
        <nav className="mt-10 space-y-3 text-sm">
          {links.map(([href, label]) => {
            const path = href ? `/admin/${href}` : "/admin";
            const active = pathname === path;
            return (
              <Link
                key={href}
                href={path}
                className={`block ${active ? "text-champ" : "text-arena hover:text-blanco"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
