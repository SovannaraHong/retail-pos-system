"use client";

import { useEffect } from "react";
import { Package, Pencil, X } from "lucide-react";
import type { Product } from "@/types/product";
import { focusRing, money } from "@/libs/format";
import { StockPill } from "./stock-pill";

interface Props {
  product: Product;
  canEdit: boolean;
  onEdit: (p: Product) => void;
  onClose: () => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-[#7d8aa1]">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-[#1c2740]">
        {children || "—"}
      </dd>
    </div>
  );
}

export function ProductDetailModal({
  product: p,
  canEdit,
  onEdit,
  onClose,
}: Props) {
  // close with Escape + lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const margin =
    p.cost_price !== undefined && p.sell_price > 0
      ? ((p.sell_price - p.cost_price) / p.sell_price) * 100
      : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${p.name} details`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* header */}
        <div className="flex items-start gap-4 border-b border-[#f0f3f9] p-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4f7fc] text-[#9aa5b8]">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_url}
                alt={p.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-8 w-8" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-extrabold text-[#1c2740]">
              {p.name}
            </h3>
            <p className="truncate text-sm text-[#7d8aa1]">
              {[p.sku, p.brand?.name].filter(Boolean).join(" · ") || "No SKU"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StockPill product={p} />
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  p.is_active
                    ? "bg-[#e3f7ec] text-[#1f9d55]"
                    : "bg-[#eef1f7] text-[#5d6b85]"
                }`}
              >
                {p.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`rounded-lg p-2 text-[#7d8aa1] hover:bg-[#f1f5fd] ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="space-y-6 overflow-y-auto p-5">
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
              General
            </h4>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Category">{p.category?.name}</Field>
              <Field label="Brand">{p.brand?.name}</Field>
              <Field label="Supplier">{p.supplier?.name}</Field>
              <Field label="SKU">{p.sku}</Field>
              <Field label="Barcode">{p.barcode}</Field>
              <Field label="Unit">{p.unit}</Field>
            </dl>
          </section>

          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
              Pricing
            </h4>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Sell price">{money(p.sell_price)}</Field>
              <Field label="Cost price">
                {p.cost_price !== undefined ? money(p.cost_price) : null}
              </Field>
              <Field label="Tax rate">{`${p.tax_rate ?? 0}%`}</Field>
              <Field label="Margin">
                {margin !== null ? `${margin.toFixed(1)}%` : null}
              </Field>
            </dl>
          </section>

          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
              Stock
            </h4>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Track stock">{p.track_stock ? "Yes" : "No"}</Field>
              <Field label="In stock">
                {p.track_stock ? String(p.stock_qty) : null}
              </Field>
              <Field label="Reorder level">
                {p.track_stock ? String(p.reorder_level) : null}
              </Field>
            </dl>
          </section>

          {p.description && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
                Description
              </h4>
              <p className="whitespace-pre-line text-sm text-[#3d4a63]">
                {p.description}
              </p>
            </section>
          )}

          <section>
            <dl className="grid grid-cols-2 gap-4 border-t border-[#f0f3f9] pt-4">
              <Field label="Created">{formatDate(p.created_at)}</Field>
              <Field label="Last updated">{formatDate(p.updated_at)}</Field>
            </dl>
          </section>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 border-t border-[#f0f3f9] bg-[#f8faff] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#3d4a63] hover:bg-[#eef1f7] ${focusRing}`}
          >
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(p)}
              className={`inline-flex items-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d5fe0] ${focusRing}`}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
