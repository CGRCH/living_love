"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch, getSession, logout } from "@/lib/auth-client";
import { formatCLP } from "@/lib/api";

type User = { email: string; first_name: string; last_name: string; role: string };

export default function AccountAppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    getSession().then((s) => {
      if (!s?.user) router.replace("/cuenta/ingresar");
      else setUser(s.user);
    });
  }, [router]);

  if (!user) return <div className="px-4 py-20">Cargando…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="border-r border-arena/40 pr-6">
          <p className="font-serif text-2xl">Mi cuenta</p>
          <p className="mt-1 text-sm text-taupe">{user.email}</p>
          <nav className="mt-8 flex flex-col gap-3 text-sm uppercase tracking-label">
            <Link href="/cuenta">Resumen</Link>
            <Link href="/cuenta/pedidos">Pedidos</Link>
            <Link href="/cuenta/cotizaciones">Cotizaciones</Link>
            <Link href="/cuenta/direcciones">Direcciones</Link>
            <Link href="/cuenta/perfil">Perfil</Link>
            <button
              type="button"
              className="text-left text-taupe"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              Cerrar sesión
            </button>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}

export { authFetch, formatCLP };
