"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-3xl">No pudimos cargar esta página</h1>
      <p className="mt-4 text-sm text-taupe">
        Hubo un problema al conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button type="button" onClick={() => reset()}>
          Reintentar
        </Button>
        <Link href="/" className="text-sm underline text-taupe">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
