"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/lib/auth-client";

const links = [
  ["", "Resumen"],
  ["pedidos", "Pedidos"],
  ["cotizaciones", "Cotizaciones"],
  ["productos", "Productos"],
  ["categorias", "Categorías"],
  ["telas", "Telas"],
  ["despachos", "Despachos"],
  ["pagos", "Pagos"],
  ["usuarios", "Usuarios"],
  ["ajustes", "Ajustes"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname.endsWith("/login")) {
      setReady(true);
      return;
    }
    getSession().then((s) => {
      if (!s?.user || s.user.role !== "admin") {
        router.replace("/admin/login");
        return;
      }
      setReady(true);
    });
  }, [pathname, router]);

  if (!ready) return null;

  if (pathname.endsWith("/login")) {
    return <div className="min-h-screen bg-marfil">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-marfil">
      <aside className="hidden w-64 shrink-0 bg-onix p-6 text-blanco md:block">
        <p className="font-serif text-xl">LIVING LOVE</p>
        <p className="text-[10px] uppercase tracking-label text-champ">Panel administración</p>
        <nav className="mt-10 space-y-3 text-sm">
          {links.map(([href, label]) => {
            const path = href ? `/admin/${href}` : "/admin";
            const active = pathname === path || pathname.startsWith(`${path}/`);
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
          <button
            type="button"
            className="mt-8 text-arena"
            onClick={async () => {
              await logout();
              router.push("/admin/login");
            }}
          >
            Salir
          </button>
        </nav>
      </aside>
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
