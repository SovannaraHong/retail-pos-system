"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { ProductService } from "@/services/product-service";
import type {
  Product,
  StoreProductPayload,
  UpdateProductPayload,
} from "@/types/product";
import type { LookupOption } from "@/hooks/use-product-lookups";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
import { ProductThumb } from "./product-thumb";

const DURATION = 300; // ms, keep in sync with duration-300 below

interface Props {
  product: Product | null; // null = create
  categories: LookupOption[];
  brands: LookupOption[];
  suppliers: LookupOption[];
  /** Called after the closing animation finished: unmount the drawer here. */
  onClose: () => void;
  /** Called right after a successful save (the drawer then closes itself). */
  onSaved: (mode: "created" | "updated") => void;
}

interface FormState {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  unit: string;
  category_id: string;
  brand_id: string;
  supplier_id: string;
  cost_price: string;
  sell_price: string;
  tax_rate: string;
  track_stock: boolean;
  stock_qty: string;
  reorder_level: string;
  is_active: boolean;
}

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const idOrNull = (s: string) => (s ? Number(s) : null);

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2.5 text-sm text-[#1c2740] placeholder:text-[#9aa5b8] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const checkboxCls =
  "h-4 w-4 rounded border-[#c5cddb] text-[#2f6fe8] focus:ring-[#2f6fe8]";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-[#3d4a63]">
      {label}
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs font-normal text-[#9aa5b8]">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-normal text-[#e5484d]">
          {error}
        </span>
      )}
    </label>
  );
}

function OptionSelect({
  value,
  onChange,
  options,
  empty,
}: {
  value: string;
  onChange: (v: string) => void;
  options: LookupOption[];
  empty: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    >
      <option value="">{empty}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

export function ProductDrawer({
  product,
  categories,
  brands,
  suppliers,
  onClose,
  onSaved,
}: Props) {
  const isEdit = product !== null;
  const { open, close } = useOverlayTransition(onClose, DURATION);

  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    description: product?.description ?? "",
    unit: product?.unit ?? "pcs",
    category_id: product?.category?.id ? String(product.category.id) : "",
    brand_id: product?.brand?.id ? String(product.brand.id) : "",
    supplier_id: product?.supplier?.id ? String(product.supplier.id) : "",
    cost_price: product?.cost_price != null ? String(product.cost_price) : "",
    sell_price: product ? String(product.sell_price) : "",
    tax_rate: product ? String(product.tax_rate) : "0",
    track_stock: product?.track_stock ?? true,
    stock_qty: product ? String(product.stock_qty) : "0",
    reorder_level: product ? String(product.reorder_level) : "10",
    is_active: product?.is_active ?? true,
  });

  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  // Esc closes (with animation), unless a save is running
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, saving]);

  // lock the page behind the drawer from scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const setText =
    (k: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.checked }));
  const setOption = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const local: Record<string, string> = {};
    if (!form.name.trim()) local.name = "Enter a product name.";
    if (form.sell_price.trim() === "" || Number(form.sell_price) < 0)
      local.sell_price = "Enter a selling price of 0 or more.";
    setErrors(local);
    if (Object.keys(local).length) return;

    const shared = {
      category_id: idOrNull(form.category_id),
      brand_id: idOrNull(form.brand_id),
      supplier_id: idOrNull(form.supplier_id),
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      description: form.description.trim() || null,
      unit: form.unit.trim() || null,
      cost_price: num(form.cost_price),
      sell_price: Number(form.sell_price),
      tax_rate: num(form.tax_rate),
      track_stock: form.track_stock,
      reorder_level: num(form.reorder_level),
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (isEdit) {
        const payload: UpdateProductPayload = {
          ...shared,
          sku: form.sku.trim() || undefined,
          image: file ?? undefined,
          remove_image: removeImage && !file ? true : undefined,
        };
        await ProductService.update(product.id, payload);
        onSaved("updated");
      } else {
        const payload: StoreProductPayload = {
          ...shared,
          sku: form.sku.trim() || null,
          image: file,
          stock_qty: num(form.stock_qty),
        };
        await ProductService.create(payload);
        onSaved("created");
      }
      close(); // slide out, then the parent unmounts us
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      setFormError(
        Object.keys(parsed.fields).length
          ? "Fix the highlighted fields and save again."
          : parsed.message,
      );
    } finally {
      setSaving(false);
    }
  }

  const currentImage =
    preview ?? (removeImage ? null : (product?.image_url ?? null));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* backdrop fades in / out */}
      <button
        type="button"
        aria-label="Close"
        onClick={saving ? undefined : close}
        className={`absolute inset-0 bg-[#0f1a33]/45 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* panel slides in from the right */}
      <form
        onSubmit={submit}
        className={`relative flex h-full w-full max-w-3xl transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* blue header, matches the sidebar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1957d6] to-[#2f80ff] px-8 py-5 text-white">
          <h2 id="drawer-title" className="text-lg font-bold">
            {isEdit ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            aria-label="Close"
            className={`rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-7">
          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-[#ffd0d0] bg-[#ffe9ec] px-3 py-2.5 text-sm text-[#c54646]"
            >
              {formError}
            </p>
          )}

          {/* image */}
          <div className="flex items-center gap-5 rounded-2xl bg-[#f4f7fc] p-5">
            {currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt=""
                className="h-24 w-24 rounded-xl bg-white object-cover"
              />
            ) : (
              <ProductThumb
                product={{ name: form.name || "New product", image_url: null }}
                className="h-24 w-24"
              />
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`inline-flex items-center gap-2 rounded-lg border border-[#dfe6f2] bg-white px-3 py-2 text-sm font-medium text-[#3d4a63] hover:bg-[#f1f5fd] ${focusRing}`}
                >
                  <ImagePlus className="h-4 w-4 text-[#2f6fe8]" />
                  {currentImage ? "Change image" : "Upload image"}
                </button>
                {currentImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRemoveImage(true);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium text-[#e5484d] hover:bg-[#ffe9ec] ${focusRing}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-[#9aa5b8]">
                PNG or JPG, square works best.
              </p>
              {errors.image && (
                <p className="text-xs text-[#e5484d]">{errors.image}</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f) setRemoveImage(false);
                }}
              />
            </div>
          </div>

          <Field label="Product name" error={errors.name}>
            <input
              value={form.name}
              onChange={setText("name")}
              placeholder="e.g. Wireless Earphones"
              className={inputCls}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="SKU" error={errors.sku}>
              <input
                value={form.sku}
                onChange={setText("sku")}
                placeholder="PRD019"
                className={inputCls}
              />
            </Field>
            <Field label="Barcode" error={errors.barcode}>
              <input
                value={form.barcode}
                onChange={setText("barcode")}
                placeholder="Scan or type"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Category" error={errors.category_id}>
              <OptionSelect
                value={form.category_id}
                onChange={setOption("category_id")}
                options={categories}
                empty="No category"
              />
            </Field>
            <Field label="Brand" error={errors.brand_id}>
              <OptionSelect
                value={form.brand_id}
                onChange={setOption("brand_id")}
                options={brands}
                empty="No brand"
              />
            </Field>
            <Field label="Supplier" error={errors.supplier_id}>
              <OptionSelect
                value={form.supplier_id}
                onChange={setOption("supplier_id")}
                options={suppliers}
                empty="No supplier"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Selling price" error={errors.sell_price}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.sell_price}
                onChange={setText("sell_price")}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label="Cost price" error={errors.cost_price}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost_price}
                onChange={setText("cost_price")}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label="Tax (%)" error={errors.tax_rate}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.tax_rate}
                onChange={setText("tax_rate")}
                className={inputCls}
              />
            </Field>
          </div>

          {/* stock */}
          <fieldset className="space-y-4 rounded-2xl border border-[#e9eef7] p-5">
            <legend className="px-1 text-xs font-bold text-[#1c2740]">
              Stock
            </legend>
            <label className="flex items-center gap-3 text-sm text-[#3d4a63]">
              <input
                type="checkbox"
                checked={form.track_stock}
                onChange={setBool("track_stock")}
                className={checkboxCls}
              />
              Track stock for this product
            </label>

            {form.track_stock && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Field
                  label="Quantity"
                  error={errors.stock_qty}
                  hint={
                    isEdit ? "Change it with a stock adjustment." : undefined
                  }
                >
                  <input
                    type="number"
                    min="0"
                    value={form.stock_qty}
                    onChange={setText("stock_qty")}
                    disabled={isEdit}
                    className={`${inputCls} disabled:bg-[#eef1f7] disabled:text-[#7d8aa1]`}
                  />
                </Field>
                <Field label="Low-stock alert" error={errors.reorder_level}>
                  <input
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={setText("reorder_level")}
                    className={inputCls}
                  />
                </Field>
                <Field label="Unit" error={errors.unit}>
                  <input
                    value={form.unit}
                    onChange={setText("unit")}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </fieldset>

          <Field label="Description" error={errors.description}>
            <textarea
              value={form.description}
              onChange={setText("description")}
              rows={3}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <label className="flex items-center gap-3 text-sm text-[#3d4a63]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={setBool("is_active")}
              className={checkboxCls}
            />
            Active — available to sell
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#f0f3f9] px-8 py-4">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className={`min-w-28 rounded-lg border border-[#dfe6f2] px-4 py-2.5 text-sm font-medium text-[#3d4a63] hover:bg-[#f4f7fc] disabled:opacity-50 ${focusRing}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`min-w-36 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d5fe0] disabled:opacity-60 ${focusRing}`}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}
