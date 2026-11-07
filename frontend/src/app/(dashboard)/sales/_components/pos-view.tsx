"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  Minus,
  Package,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Tags,
  Trash2,
} from "lucide-react";
import { ProductService } from "@/services/product-service";
import { SaleService } from "@/services/sale-service";
import { ShiftService } from "@/services/shift-service";
import type { Product } from "@/types/product";
import type { KhqrPayment, Sale } from "@/types/sale";
import type { Shift } from "@/types/shift";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useProductLookups } from "@/hooks/use-product-lookups";
import { parseApiError } from "@/libs/api-error";
import { focusRing, money } from "@/libs/format";
import { KhqrModal } from "./khqr-modal";
import { ReceiptModal, type ReceiptData } from "./receipt-modal";
import { PageSkeleton } from "@/shared/page-skeleton";
import {
  CloseShiftModal,
  OpenShiftModal,
} from "../../shifts/_components/shift-modals";

type Method = "cash" | "khqr";
type CartLine = { product: Product; qty: number };

const TOAST_MS = 3200;
const card =
  "rounded-2xl border border-[#eef1f6] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";
const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

const maxQty = (p: Product) => (p.track_stock ? p.stock_qty : Infinity);
const price = (p: Product) => Number(p.sell_price) || 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function PosView() {
  const router = useRouter();
  const { ready, can } = useAuth();
  const lookups = useProductLookups();

  // ---- product list ----
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const debounced = useDebounce(search, 400);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{
    key: string | null;
    rows: Product[];
    error: string | null;
  }>({ key: null, rows: [], error: null });

  const params = useMemo(
    () => ({
      page: 1,
      per_page: 60,
      search: debounced.trim() || undefined,
      category_id: categoryId ?? undefined,
      is_active: true,
    }),
    [debounced, categoryId],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;
  const loading = result.key !== requestKey;
  const firstLoad = result.key === null;

  const canView = can("sales.view");

  useEffect(() => {
    if (ready && !canView) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !canView) return;
    const controller = new AbortController();
    let cancelled = false;

    ProductService.getAll(params, controller.signal)
      .then((res) => {
        if (!cancelled)
          setResult({ key: requestKey, rows: res.data, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setResult((r) => ({
            ...r,
            key: requestKey,
            error: parseApiError(err).message,
          }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, canView, params, requestKey]);

  // ---- cart ----
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<Method>("cash");
  const [discountInput, setDiscountInput] = useState("");
  const [receivedInput, setReceivedInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [khqr, setKhqr] = useState<KhqrPayment | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- shift ----
  const canOpenShift = can("shifts.open");
  const canCloseShift = can("shifts.close");
  const [shift, setShift] = useState<Shift | null>(null);
  const [shiftLoaded, setShiftLoaded] = useState(false);
  const [shiftModal, setShiftModal] = useState<"open" | "close" | null>(null);

  useEffect(() => {
    if (!ready || !canView) return;
    const controller = new AbortController();
    let cancelled = false;

    ShiftService.current(controller.signal)
      .then((s) => {
        if (cancelled) return;
        setShift(s);
        setShiftLoaded(true);
        if (!s && canOpenShift) setShiftModal("open"); // ask once on load
      })
      .catch((err) => {
        if (cancelled) return;
        setShiftLoaded(true);
        setToast({ type: "error", text: parseApiError(err).message });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, canView, canOpenShift]);

  const qtyInCart = (id: number) =>
    cart.find((l) => l.product.id === id)?.qty ?? 0;

  function addProduct(p: Product) {
    setCart((c) => {
      const i = c.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        if (c[i].qty >= maxQty(p)) return c;
        return c.map((l, idx) => (idx === i ? { ...l, qty: l.qty + 1 } : l));
      }
      if (maxQty(p) < 1) return c;
      return [...c, { product: p, qty: 1 }];
    });
  }

  function setQty(id: number, qty: number) {
    setCart((c) =>
      c
        .map((l) =>
          l.product.id === id
            ? { ...l, qty: Math.min(qty, maxQty(l.product)) }
            : l,
        )
        .filter((l) => l.qty >= 1),
    );
  }

  const removeLine = (id: number) =>
    setCart((c) => c.filter((l) => l.product.id !== id));

  // ---- totals (estimate; the server calculates the final amounts) ----
  const subtotal = cart.reduce((s, l) => s + price(l.product) * l.qty, 0);
  const tax = cart.reduce(
    (s, l) =>
      s + price(l.product) * l.qty * ((Number(l.product.tax_rate) || 0) / 100),
    0,
  );
  const discount = Math.min(Math.max(Number(discountInput) || 0, 0), subtotal);
  const total = round2(subtotal + tax - discount);
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  const received = receivedInput.trim() === "" ? total : Number(receivedInput);
  const change = round2(received - total);

  const canCreate = can("sales.create");
  const canPay =
    cart.length > 0 &&
    canCreate &&
    !!shift && // must have an open shift
    !busy &&
    (method === "khqr" || (Number.isFinite(received) && received >= total));

  function resetOrder() {
    setCart([]);
    setDiscountInput("");
    setReceivedInput("");
    setReloadKey((k) => k + 1); // refresh stock numbers
  }

  const itemsPayload = () =>
    cart.map((l) => ({ product_id: l.product.id, qty: l.qty }));

  async function checkout() {
    if (!canPay) return;
    setBusy(true);
    try {
      if (method === "cash") {
        const res = await SaleService.create({
          discount: discount || undefined,
          items: itemsPayload(),
          payments: [{ method: "cash", amount: received }],
        });
        const s: Sale = res.data;
        setReceipt({
          invoice: s.invoice_no,
          method: "Cash",
          total: s.total,
          paid: s.paid_amount,
          change: s.change_amount,
        });
        resetOrder();
      } else {
        const res = await SaleService.createKhqr({
          discount: discount || undefined,
          items: itemsPayload(),
        });
        setKhqr(res.data);
      }
    } catch (err) {
      setToast({ type: "error", text: parseApiError(err).message });
    } finally {
      setBusy(false);
    }
  }

  function onKhqrPaid(p: KhqrPayment) {
    setKhqr(null);
    setReceipt({
      invoice: p.sale?.invoice_no ?? p.reference,
      method: "KHQR",
      total: p.sale?.total ?? p.amount,
      paid: p.amount,
      change: 0,
    });
    resetOrder();
  }

  if (!ready) return <PageSkeleton />;
  if (!canView) return null;

  const rows = result.rows;

  return (
    <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ================= LEFT: products ================= */}
      <div className="min-w-0 space-y-5">
        {/* shift bar */}
        {shiftLoaded && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${
              shift
                ? "border-[#cfeedd] bg-[#eefaf3] text-[#1f6b41]"
                : "border-[#fde7c3] bg-[#fff8ea] text-[#9a5b06]"
            }`}
          >
            <span className="font-semibold">
              {shift
                ? `Shift open since ${new Date(shift.opened_at).toLocaleString()}`
                : "No open shift. Open a shift to start selling."}
            </span>

            {shift
              ? canCloseShift && (
                  <button
                    type="button"
                    onClick={() => setShiftModal("close")}
                    className={`rounded-lg bg-white px-3 py-1.5 font-semibold text-[#e5484d] shadow-sm hover:bg-[#ffe9ec] ${focusRing}`}
                  >
                    Close shift
                  </button>
                )
              : canOpenShift && (
                  <button
                    type="button"
                    onClick={() => setShiftModal("open")}
                    className={`rounded-lg bg-[#2f6fe8] px-3 py-1.5 font-semibold text-white hover:bg-[#1d5fe0] ${focusRing}`}
                  >
                    Open shift
                  </button>
                )}
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or barcode"
            aria-label="Search products"
            className={`${control} w-full bg-white pl-9`}
          />
        </div>

        <section>
          <h3 className="mb-3 text-base font-extrabold text-[#1c2740]">
            Categories
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[{ id: null, name: "All menu" }, ...lookups.categories].map(
              (c) => {
                const active = categoryId === c.id;
                return (
                  <button
                    key={c.id ?? "all"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategoryId(c.id)}
                    className={`flex min-w-[104px] flex-col items-center gap-2 rounded-2xl border px-4 py-3.5 text-xs font-bold transition ${focusRing} ${
                      active
                        ? "border-[#2f6fe8] bg-[#eef4ff] text-[#1d5fe0] shadow-sm"
                        : "border-[#eef1f6] bg-white text-[#1c2740] hover:bg-[#f8faff]"
                    }`}
                  >
                    <Tags className="h-5 w-5" />
                    <span className="whitespace-nowrap">{c.name}</span>
                  </button>
                );
              },
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-extrabold text-[#1c2740]">
            Select menu
          </h3>

          {result.error && !loading ? (
            <div
              className={`${card} flex flex-col items-center px-6 py-14 text-center`}
            >
              <AlertCircle className="h-8 w-8 text-[#e5484d]" />
              <p className="mt-3 text-sm text-[#6c7a93]">{result.error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className={`mt-4 rounded-lg bg-[#2f6fe8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d5fe0] ${focusRing}`}
              >
                Try again
              </button>
            </div>
          ) : firstLoad ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`${card} aspect-[4/5] animate-pulse bg-[#f4f7fc]`}
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div
              className={`${card} px-6 py-16 text-center text-sm text-[#6c7a93]`}
            >
              No products found.
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 xl:grid-cols-4 ${
                loading ? "opacity-60" : ""
              }`}
            >
              {rows.map((p) => {
                const out = p.track_stock && p.stock_qty <= 0;
                const low =
                  p.track_stock && p.stock_qty > 0 && p.stock_qty <= 10;
                const inCart = qtyInCart(p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={out}
                    onClick={() => addProduct(p)}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                      out
                        ? "cursor-not-allowed border-[#e3e6eb] bg-[#f1f2f5]"
                        : "border-[#eef1f6] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.06)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(30,60,120,0.12)]"
                    } ${inCart ? "ring-2 ring-[#2f6fe8]" : ""} ${focusRing}`}
                  >
                    {/* image fills the whole box */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-[#cdd6e9] to-[#606265]">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                            out ? "opacity-60 grayscale" : ""
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#9aa5b8]">
                          <Package className="h-10 w-10" />
                        </div>
                      )}

                      {/* status pill (top-left) */}
                      {out ? (
                        <span className="absolute left-3 top-3 rounded-full bg-[#4b5565] px-2.5 py-1 text-[11px] font-bold text-white">
                          Out of stock
                        </span>
                      ) : low ? (
                        <span className="absolute left-3 top-3 rounded-full bg-[#f59e0b] px-2.5 py-1 text-[11px] font-bold text-white">
                          Low stock
                        </span>
                      ) : null}

                      {/* in-cart count (top-right) */}
                      {inCart > 0 && (
                        <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2f6fe8] px-2 text-xs font-bold text-white shadow">
                          {inCart}
                        </span>
                      )}
                    </div>

                    <div className="bg-[#ffffff] p-3.5">
                      <p
                        className={`truncate text-[15px] font-bold ${
                          out ? "text-[#8a96ab]" : "text-[#1c2740]"
                        }`}
                      >
                        {p.name}
                      </p>
                      <p
                        className={`mt-0.5 text-xs ${
                          low
                            ? "font-semibold text-[#d97706]"
                            : "text-[#8a96ab]"
                        }`}
                      >
                        {p.track_stock
                          ? `${p.stock_qty} Available`
                          : "No stock tracking"}
                      </p>
                      <p className="text-gray-600 line-clamp-2  text-[10px]">
                        {p.description}
                      </p>
                      <p
                        className={`mt-3 text-xl font-extrabold tabular-nums ${
                          out ? "text-[#8a96ab]" : "text-[#1c2740]"
                        }`}
                      >
                        {money(p.sell_price)}
                        <span className="ml-1 text-xs font-medium text-[#8a96ab]">
                          / Portion
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ================= RIGHT: cart (max 4 rows visible, scroll for more) ================= */}
      <aside className={`${card} flex flex-col p-5`}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#1c2740]">
            Detail items
          </h3>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className={`rounded-lg px-2 py-1 text-xs font-semibold text-[#e5484d] hover:bg-[#ffe9ec] ${focusRing}`}
            >
              Clear all
            </button>
          )}
        </div>

        {/* 4 rows x ~89px = 356px; scrolls after that, scrollbar hidden */}
        <div className="mt-3 max-h-[356px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-sm text-[#9aa5b8]">
              <ShoppingCart className="mb-2 h-8 w-8" />
              Tap a product to add it.
            </div>
          ) : (
            cart.map(({ product: p, qty }) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-[#eef1f6] py-3 last:border-0"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3f5f9] text-[#9aa5b8]">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#1c2740]">
                    {p.name}
                  </p>
                  <p className="text-xs text-[#8a96ab]">
                    {money(price(p))} each
                  </p>

                  {/* qty: white minus with border, solid blue plus */}
                  <div className="mt-2 flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => setQty(p.id, qty - 1)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#d5dcea] bg-white text-[#3d4a63] hover:bg-[#f4f7fc] ${focusRing}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-extrabold tabular-nums text-[#1c2740]">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase"
                      disabled={qty >= maxQty(p)}
                      onClick={() => setQty(p.id, qty + 1)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg bg-[#2f6fe8] text-white shadow-sm hover:bg-[#1d5fe0] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-extrabold tabular-nums text-[#1c2740]">
                    {money(price(p) * qty)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => removeLine(p.id)}
                    className={`rounded-md p-1 text-[#9aa5b8] hover:bg-[#ffe9ec] hover:text-[#e5484d] ${focusRing}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* totals */}
        <dl className="mt-3 space-y-2 border-t border-[#eef1f6] pt-4 text-sm">
          <div className="flex justify-between text-[#8a96ab]">
            <dt>Item</dt>
            <dd className="font-bold text-[#1c2740]">{itemCount} (Items)</dd>
          </div>
          <div className="flex justify-between text-[#8a96ab]">
            <dt>Subtotal</dt>
            <dd className="font-bold tabular-nums text-[#1c2740]">
              {money(subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-[#8a96ab]">
            <dt>Discount</dt>
            <dd>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0.00"
                aria-label="Discount amount"
                className="h-8 w-24 rounded-md border border-[#dfe6f2] bg-[#f4f7fc] px-2 text-right text-sm tabular-nums focus:border-[#2f6fe8] focus:outline-none"
              />
            </dd>
          </div>
          <div className="flex justify-between text-[#8a96ab]">
            <dt>Tax</dt>
            <dd className="font-bold tabular-nums text-[#1c2740]">
              {money(tax)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[#eef1f6] pt-3 text-base">
            <dt className="font-extrabold text-[#1c2740]">Total</dt>
            <dd className="text-xl font-extrabold tabular-nums text-[#1c2740]">
              {money(total)}
            </dd>
          </div>
        </dl>

        {/* payment method */}
        <h4 className="mb-2 mt-5 text-base font-extrabold text-[#1c2740]">
          Payment method
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { key: "cash", label: "Cash", Icon: Banknote },
              { key: "khqr", label: "KHQR", Icon: QrCode },
            ] as const
          ).map(({ key, label, Icon }) => {
            const active = method === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMethod(key)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition-colors ${focusRing} ${
                  active
                    ? "border-[#2f6fe8] bg-[#eef4ff] text-[#1d5fe0]"
                    : "border-[#eef1f6] bg-white text-[#3d4a63] hover:bg-[#f8faff]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>

        {method === "cash" && (
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center justify-between gap-3 text-[#8a96ab]">
              Cash received
              <input
                type="number"
                min="0"
                step="0.01"
                value={receivedInput}
                onChange={(e) => setReceivedInput(e.target.value)}
                placeholder={total.toFixed(2)}
                className="h-9 w-32 rounded-md border border-[#dfe6f2] bg-[#f4f7fc] px-2 text-right tabular-nums focus:border-[#2f6fe8] focus:outline-none"
              />
            </label>
            <div className="flex justify-between text-[#8a96ab]">
              <span>Change</span>
              <span
                className={`font-bold tabular-nums ${
                  change < 0 ? "text-[#e5484d]" : "text-[#1f9d55]"
                }`}
              >
                {money(Math.max(change, 0))}
              </span>
            </div>
            {change < 0 && (
              <p className="text-xs text-[#e5484d]">
                Amount received is too low.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={checkout}
          disabled={!canPay}
          className={`mt-5 w-full rounded-xl bg-[#2f6fe8] py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1d5fe0] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          {busy
            ? "Please wait…"
            : method === "khqr"
              ? "Generate QR"
              : "Process transaction"}
        </button>
        {!canCreate && (
          <p className="mt-2 text-center text-xs text-[#9aa5b8]">
            You don&apos;t have permission to create sales.
          </p>
        )}
        {shiftLoaded && !shift && (
          <p className="mt-2 text-center text-xs text-[#9a5b06]">
            Open a shift to process sales.
          </p>
        )}
      </aside>

      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-[80] rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === "ok" ? "bg-[#1f9d55]" : "bg-[#e5484d]"
          }`}
        >
          {toast.text}
        </div>
      )}

      {khqr && (
        <KhqrModal
          key={khqr.id}
          payment={khqr}
          onPaid={onKhqrPaid}
          onClose={() => setKhqr(null)}
          onRetry={() => {
            setKhqr(null);
            checkout();
          }}
        />
      )}

      {receipt && (
        <ReceiptModal data={receipt} onClose={() => setReceipt(null)} />
      )}

      {shiftModal === "open" && (
        <OpenShiftModal
          onClose={() => setShiftModal(null)}
          onOpened={(s) => {
            setShift(s);
            setShiftModal(null);
            setToast({ type: "ok", text: "Shift opened" });
          }}
        />
      )}

      {shiftModal === "close" && (
        <CloseShiftModal
          onClose={() => setShiftModal(null)}
          onClosed={(s) => {
            setShift(null);
            setShiftModal(null);
            const d = s.difference ?? 0;
            setToast({
              type: d === 0 ? "ok" : "error",
              text:
                d === 0
                  ? "Shift closed. Cash matches."
                  : `Shift closed. ${d > 0 ? "Over" : "Short"} by ${money(Math.abs(d))}`,
            });
          }}
        />
      )}
    </div>
  );
}
