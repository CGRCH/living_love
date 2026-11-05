import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import { PriceTag, ColorDots } from "@/components/ui/PriceTag";

export type ProductSummary = {
  slug: string;
  name: string;
  base_price: number;
  compare_at_price?: number | null;
  price_mode: string;
  images?: { image: string }[];
  option_groups?: { values?: { swatch_hex?: string }[] }[];
};

export function ProductCard({ product }: { product: ProductSummary }) {
  const img = mediaUrl(product.images?.[0]?.image);
  const quoteOnly = product.price_mode === "quote_only";
  const colors =
    product.option_groups?.flatMap((g) => g.values?.map((v) => v.swatch_hex || "") || []) || [];

  return (
    <article className="group">
      <Link href={quoteOnly ? `/cotizar?producto=${product.slug}` : `/producto/${product.slug}`}>
        <div className="relative aspect-[4/5] bg-marfil">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-arena/40 text-xs text-taupe">
              Living Love
            </div>
          )}
        </div>
        <h3 className="mt-4 font-serif text-lg">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <PriceTag
            price={product.base_price}
            compareAt={product.compare_at_price}
            quoteOnly={quoteOnly}
          />
          {!quoteOnly && <ColorDots colors={colors} />}
        </div>
      </Link>
    </article>
  );
}
