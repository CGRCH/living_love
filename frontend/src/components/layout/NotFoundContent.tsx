import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function NotFoundContent({ withChrome = true }: { withChrome?: boolean }) {
  return (
    <div className={`mx-auto max-w-lg px-4 py-24 text-center ${withChrome ? "" : "min-h-[60vh]"}`}>
      <p className="font-serif text-6xl text-onix">404</p>
      <h1 className="mt-4 font-serif text-3xl">Página no encontrada</h1>
      <p className="mt-4 text-sm text-taupe">
        La ruta que buscas no existe o el producto ya no está disponible.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link href="/">
          <Button>Ir al inicio</Button>
        </Link>
        <Link href="/categoria/livings" className="text-sm underline text-taupe">
          Ver livings
        </Link>
      </div>
    </div>
  );
}
