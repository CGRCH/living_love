import Link from "next/link";
import type { PublicSettings } from "@/lib/api";

export function Footer({ settings }: { settings: Partial<PublicSettings> }) {
  return (
    <footer className="bg-onix text-blanco">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-serif text-xl">LIVING LOVE</p>
          <p className="mt-4 text-sm text-arena/90">
            Fabricación propia de livings, cojines y soluciones para terraza en Santiago.
          </p>
          <p className="mt-4 text-sm">WhatsApp {settings.whatsapp}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-label text-champ">Tienda</p>
          <ul className="mt-4 space-y-2 text-sm text-arena">
            <li>
              <Link href="/categoria/livings">Livings</Link>
            </li>
            <li>
              <Link href="/categoria/cojines">Cojines</Link>
            </li>
            <li>
              <Link href="/categoria/cortinas-pvc">Cortinas PVC</Link>
            </li>
            <li>
              <Link href="/categoria/toldos">Toldos</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-label text-champ">Ayuda</p>
          <ul className="mt-4 space-y-2 text-sm text-arena">
            <li>
              <Link href="/politicas/devoluciones">Política de devoluciones</Link>
            </li>
            <li>
              <Link href="/cotizar">Cotizar a medida</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-label text-champ">Contacto</p>
          <p className="mt-4 text-sm text-arena">
            Escríbenos por WhatsApp para novedades de telas y colecciones.
          </p>
        </div>
      </div>
      <div className="border-t border-grafito py-4 text-center text-xs text-taupe">
        © {new Date().getFullYear()} Living Love · {settings.instagram || "@livinglove.cl"}
      </div>
    </footer>
  );
}
