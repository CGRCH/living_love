import Link from "next/link";

export default function PaymentCancelledPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl">Pago cancelado</h1>
      <p className="mt-4 text-taupe">
        {searchParams.order
          ? `El pago del pedido ${searchParams.order} no se completó.`
          : "El pago no se completó."}
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/carro" className="text-sm uppercase tracking-label underline">
          Volver al carro
        </Link>
        <Link href="/checkout" className="text-sm uppercase tracking-label underline">
          Reintentar checkout
        </Link>
      </div>
    </div>
  );
}
