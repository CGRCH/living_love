export const ORDER_STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  pending: { label: "Pendiente", badgeClass: "bg-arena/50 text-onix" },
  paid: { label: "Pagado", badgeClass: "bg-emerald-100 text-emerald-900" },
  deposit_paid: { label: "Abono pagado", badgeClass: "bg-champ/40 text-onix" },
  in_workshop: { label: "En taller", badgeClass: "bg-onix/10 text-onix ring-1 ring-onix/15" },
  ready: { label: "Listo", badgeClass: "bg-sky-100 text-sky-900" },
  shipped: { label: "Despachado", badgeClass: "bg-indigo-100 text-indigo-900" },
  delivered: { label: "Entregado", badgeClass: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelado", badgeClass: "bg-red-100 text-red-800" },
  refunded: { label: "Reembolsado", badgeClass: "bg-red-50 text-red-700" },
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_META[status]?.label ?? status.replace(/_/g, " ");
}

export function orderStatusBadgeClass(status: string) {
  return ORDER_STATUS_META[status]?.badgeClass ?? "bg-marfil text-onix";
}
