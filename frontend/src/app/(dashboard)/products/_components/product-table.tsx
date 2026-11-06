import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { focusRing, money } from "@/libs/format";
import { ProductThumb } from "./product-thumb";
import { StockMeter, StockPill } from "./stock-pill";

interface Props {
  products: Product[];
  selected: Set<number>;
  busy?: boolean; // refetching: keep rows visible but dim them
  canEdit: boolean;
  canDelete: boolean;
  onView: (p: Product) => void;
  onToggle: (id: number) => void;
  onTogglePage: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

const checkbox =
  "h-4 w-4 rounded border-[#c5cddb] cursor-pointer text-[#2f6fe8] focus:ring-[#2f6fe8]";

function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 text-[#7d8aa1] transition-colors ${focusRing} ${
        danger
          ? "hover:bg-[#ffe9ec] hover:text-[#e5484d]"
          : "hover:bg-[#e8f0ff] hover:text-[#2f6fe8]"
      }`}
    >
      {children}
    </button>
  );
}

export function ProductTable({
  products,
  selected,
  busy,
  canEdit,
  canDelete,
  onToggle,
  onView,
  onTogglePage,
  onEdit,
  onDelete,
}: Props) {
  const allSelected =
    products.length > 0 && products.every((p) => selected.has(p.id));
  const showActions = canEdit || canDelete;

  return (
    <div
      className={`overflow-x-auto transition-opacity ${busy ? "opacity-60" : ""}`}
      aria-busy={busy}
    >
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-[#f4f7fc] text-xs text-[#5d6b85]">
          <tr>
            <th className="w-12 py-3 pl-5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onTogglePage}
                aria-label="Select all on this page"
                className={checkbox}
              />
            </th>
            <th className="py-3 pr-4 font-medium">Product</th>
            <th className="py-3 pr-4 font-medium">Category</th>
            <th className="py-3 pr-4 text-right font-medium">Price</th>
            <th className="py-3 pr-4 font-medium">Stock</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            {showActions && (
              <th className="py-3 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f3f9]">
          {products.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <tr
                key={p.id}
                tabIndex={0}
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).closest("input, button, a, label")
                  )
                    return;
                  onView(p);
                }}
                onKeyDown={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    onView(p);
                  }
                }}
                className={`transition-colors hover:bg-[#f8faff] ${isSel ? "bg-[#eef4ff]" : ""}`}
              >
                <td className="py-3 pl-5">
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => onToggle(p.id)}
                    aria-label={`Select ${p.name}`}
                    className={checkbox}
                  />
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={p} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-[#1c2740]">
                        <span className="truncate">{p.name}</span>
                        {!p.is_active && (
                          <span className="rounded-full bg-[#eef1f7] px-2 py-0.5 text-[10px] font-semibold text-[#5d6b85]">
                            Inactive
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-[#7d8aa1]">
                        {[p.sku, p.brand?.name].filter(Boolean).join(" · ") ||
                          "No SKU"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-[#3d4a63]">
                  {p.category?.name ?? "—"}
                </td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums text-[#1c2740]">
                  {money(p.sell_price)}
                </td>
                <td className="py-3 pr-4">
                  {" "}
                  <StockMeter product={p} />
                </td>
                <td className="py-3 pr-4">
                  <StockPill product={p} />
                </td>
                {showActions && (
                  <td className="py-3 pr-5">
                    <div className="flex justify-end gap-0.5">
                      {canEdit && (
                        <IconButton
                          label={`Edit ${p.name}`}
                          onClick={() => onEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          label={`Delete ${p.name}`}
                          danger
                          onClick={() => onDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
