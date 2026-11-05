import Link from "next/link";

const nav = [
  { href: "/categoria/livings", label: "Livings" },
  { href: "/categoria/cojines", label: "Cojines" },
  { href: "/categoria/cortinas-pvc", label: "Exterior" },
  { href: "/cotizar", label: "Cotizar" },
];

export function Header({ transparent }: { transparent?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-40 border-b ${transparent ? "border-white/10 bg-onix/40 text-blanco backdrop-blur" : "border-arena/40 bg-blanco text-onix"}`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4 px-4 py-4 lg:px-8">
        <nav className="hidden items-center gap-6 text-[10px] uppercase tracking-label md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-champ">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-center md:col-start-2">
          <Link href="/" className="font-serif text-xl tracking-wide md:text-2xl">
            LIVING LOVE
          </Link>
          <p className="hidden text-[9px] uppercase tracking-label text-taupe md:block">
            Muebles de autor · Chile
          </p>
        </div>
        <div className="flex items-center justify-end gap-4 text-[10px] uppercase tracking-label">
          <Link href="/buscar" className="hidden sm:inline">
            Buscar
          </Link>
          <Link href="/cuenta">Cuenta</Link>
          <Link href="/carro" className="relative">
            Carro
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center bg-champ px-1 text-[9px] text-onix">
              ·
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
