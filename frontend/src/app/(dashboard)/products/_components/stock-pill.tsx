import type { Product } from "@/types/product";

export type StockState = "in" | "low" | "out" | "untracked";

export function getStockState(p: Product): StockState {
  if (!p.track_stock) return "untracked";
  if (p.stock_qty <= 0) return "out";
  if (p.is_low_stock) return "low";
  return "in";
}

const META: Record<
  StockState,
  { label: string; pill: string; dot: string; bar: string }
> = {
  in: {
    label: "In stock",
    pill: "bg-[#dff5e6] text-[#1f8a4c]",
    dot: "bg-[#22b35e]",
    bar: "bg-[#22b35e]",
  },
  low: {
    label: "Low stock",
    pill: "bg-[#fff1d8] text-[#b97917]",
    dot: "bg-[#f5a524]",
    bar: "bg-[#f5a524]",
  },
  out: {
    label: "Out of stock",
    pill: "bg-[#ffe6e6] text-[#d64545]",
    dot: "bg-[#ef4444]",
    bar: "bg-[#ef4444]",
  },
  untracked: {
    label: "Not tracked",
    pill: "bg-[#eef1f7] text-[#5d6b85]",
    dot: "bg-[#9aa5b8]",
    bar: "bg-[#c5cddb]",
  },
};

export function StockPill({ product }: { product: Product }) {
  const m = META[getStockState(product)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/** Quantity + small bar. The bar is full at 3x the reorder level. */
export function StockMeter({ product }: { product: Product }) {
  if (!product.track_stock) {
    return <span className="text-sm text-[#9aa5b8]">—</span>;
  }

  const state = getStockState(product);
  const full = Math.max(Number(product.reorder_level) * 3, 1);
  const pct = Math.min(100, Math.round((product.stock_qty / full) * 100));

  return (
    <div className="w-32">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold tabular-nums text-[#1c2740]">
          {product.stock_qty}
        </span>
        <span className="text-xs text-[#7d8aa1]">{product.unit ?? "pcs"}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[#eaf0fa]"
        aria-hidden
      >
        <div
          className={`h-full rounded-full ${META[state].bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
