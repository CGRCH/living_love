import clsx from "clsx";
import { formatCLP } from "@/lib/api";

export function PriceTag({
  price,
  compareAt,
  quoteOnly,
}: {
  price: number;
  compareAt?: number | null;
  quoteOnly?: boolean;
}) {
  if (quoteOnly) {
    return (
      <span className="text-[11px] uppercase tracking-label text-champ">Solo cotización</span>
    );
  }
  const discount =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="font-serif text-lg">{formatCLP(price)}</span>
      {compareAt && compareAt > price && (
        <>
          <span className="text-sm text-taupe line-through">{formatCLP(compareAt)}</span>
          {discount && (
            <span className="bg-champ/20 px-2 py-0.5 text-[10px] uppercase tracking-label text-onix">
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function ColorDots({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-1">
      {colors.filter(Boolean).slice(0, 5).map((c) => (
        <span
          key={c}
          className={clsx("h-2.5 w-2.5 rounded-full border border-arena/60")}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block bg-champ/25 px-2 py-0.5 text-[10px] uppercase tracking-label text-onix",
        className,
      )}
    >
      {children}
    </span>
  );
}
