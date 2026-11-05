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

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={`space-y-3 text-sm ${className ?? ""}`}>
      {links.map(([href, label]) => {
        const path = href ? `/admin/${href}` : "/admin";
        const active = pathname === path || pathname.startsWith(`${path}/`);
        return (
          <Link
            key={href}
            href={path}
            onClick={onNavigate}
            className={`block py-1 ${active ? "text-champ" : "text-arena hover:text-blanco"}`}
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
          onNavigate?.();
          window.location.href = "/admin/login";
        }}
      >
        Salir
      </button>
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "ok" | "denied">("loading");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname.endsWith("/login")) {
      setAuthState("ok");
      return;
    }

    let cancelled = false;
    const verify = async (attempt = 0) => {
      const session = await getSession();
      if (cancelled) return;
      if (session?.user?.role === "admin") {
        setAuthState("ok");
        return;
      }
      if (attempt < 3) {
        setTimeout(() => verify(attempt + 1), 400);
        return;
      }
      setAuthState("denied");
      router.replace("/admin/login");
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname.endsWith("/login")) {
    return <div className="min-h-screen overflow-x-hidden bg-marfil">{children}</div>;
  }

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-marfil text-sm text-taupe">
        Cargando panel…
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-marfil text-sm text-taupe">
        Redirigiendo…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-marfil" data-admin-shell="ready">
      <aside className="hidden w-64 shrink-0 bg-onix p-6 text-blanco md:block">
        <p className="font-serif text-xl">LIVING LOVE</p>
        <p className="text-[10px] uppercase tracking-label text-champ">Panel administración</p>
        <div className="mt-10">
          <NavLinks pathname={pathname} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-arena/40 bg-marfil p-4 md:hidden">
          <p className="font-serif text-lg">Admin</p>
          <button
            type="button"
            className="min-h-10 min-w-10 border border-arena px-3 text-sm"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menú
          </button>
        </header>
        {menuOpen && (
          <div className="border-b border-arena/40 bg-onix p-4 text-blanco md:hidden">
            <NavLinks
              pathname={pathname}
              onNavigate={() => {
                setMenuOpen(false);
                router.push(pathname);
              }}
            />
          </div>
        )}
        <div className="max-w-full p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
