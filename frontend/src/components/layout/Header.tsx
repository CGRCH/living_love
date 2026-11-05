"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";

const nav = [
  { href: "/categoria/livings", label: "Livings" },
  { href: "/categoria/cojines", label: "Cojines" },
  { href: "/categoria/cortinas-pvc", label: "Exterior" },
  { href: "/cotizar", label: "Cotizar" },
];

export function Header({ transparent }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const light = transparent;

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b",
        light ? "border-white/10 bg-onix/50 text-blanco backdrop-blur-md" : "border-arena/40 bg-blanco text-onix",
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" className="md:hidden" aria-label="Menú" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
          <nav className="hidden items-center gap-6 text-[10px] uppercase tracking-label md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-champ">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="text-center">
          <Link href="/" className="font-serif text-xl tracking-wide md:text-2xl">
            LIVING LOVE
          </Link>
          <p className={clsx("hidden text-[9px] uppercase tracking-label md:block", light ? "text-arena" : "text-taupe")}>
            Muebles de autor · Chile
          </p>
        </div>
        <div className="flex items-center justify-end gap-4 text-[10px] uppercase tracking-label">
          <Link href="/cuenta" className="hidden sm:inline">
            Cuenta
          </Link>
          <Link href="/carro" className="relative">
            Carro
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center bg-champ px-1 text-[9px] text-onix">
              ·
            </span>
          </Link>
        </div>
      </div>
      {open && (
        <nav className="border-t border-arena/30 bg-onix px-4 py-4 text-blanco md:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="block py-2 text-sm uppercase tracking-label" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/cuenta" className="block py-2 text-sm uppercase tracking-label">
            Mi cuenta
          </Link>
        </nav>
      )}
    </header>
  );
}
