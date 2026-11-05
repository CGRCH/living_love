import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-1 text-[10px] font-medium ${orderStatusBadgeClass(status)}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
