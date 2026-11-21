"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { X, Plus, Trash2, Search, AlertCircle, ShoppingBag, ChevronDown } from "lucide-react";
import type { StorePurchasePayload } from "@/types/purchase";
import { ProductService } from "@/services/product-service";
import { SupplierService } from "@/services/supplier-service";
import type { Product } from "@/types/product";
import type { Supplier } from "@/types/supplier";
import { money } from "@/libs/format";

interface PurchaseDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: StorePurchasePayload) => Promise<void>;
}

interface FormItem {
  product_id: number;
  product?: Product;
  qty: number;
  unit_cost: number;
}

export function PurchaseDrawer({ open, onClose, onSubmit }: PurchaseDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suppliers & Products
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [status, setStatus] = useState<"received" | "ordered">("received");
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNo, setReferenceNo] = useState("");
  const [discount, setDiscount] = useState<number | "">("");
  const [tax, setTax] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smooth animation handling
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = requestAnimationFrame(() => setVisible(true));
      SupplierService.getAll({ per_page: 100 })
        .then((res) => setSuppliers(res.data || []))
        .catch(() => {});
      ProductService.getAll({ per_page: 200 })
        .then((res) => setProducts(res.data || []))
        .catch(() => {});
      return () => cancelAnimationFrame(timer);
    } else {
      setVisible(false);
      document.body.style.overflow = "";
      setSupplierId("");
      setStatus("received");
      setReferenceNo("");
      setDiscount("");
      setTax("");
      setPaidAmount("");
      setNote("");
      setItems([]);
      setError(null);
      setSearchProduct("");
      setProductDropdownOpen(false);
    }
  }, [open]);

  // Click outside product dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const filteredProducts = products.filter((p) => {
    const q = searchProduct.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  const addItem = (product: Product) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product,
          qty: 1,
          unit_cost: Number(product.cost_price) || 0,
        },
      ]);
    }
    setSearchProduct("");
    setProductDropdownOpen(false);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const updateItemQty = (productId: number, qty: number) => {
    setItems(
      items.map((i) =>
        i.product_id === productId ? { ...i, qty: Math.max(0.01, qty) } : i
      )
    );
  };

  const updateItemCost = (productId: number, unit_cost: number) => {
    setItems(
      items.map((i) =>
        i.product_id === productId ? { ...i, unit_cost: Math.max(0, unit_cost) } : i
      )
    );
  };

  const subtotal = items.reduce((acc, i) => acc + i.qty * i.unit_cost, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Please select a supplier from the list.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one product item.");
      return;
    }

    const paid = Number(paidAmount) || 0;
    if (paid > total) {
      setError("Paid amount cannot exceed total purchase order amount.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        supplier_id: Number(supplierId),
        reference_no: referenceNo.trim() || undefined,
        status,
        purchased_at: purchasedAt,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paid_amount: paid,
        note: note.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: Number(i.qty),
          unit_cost: Number(i.unit_cost),
        })),
      });
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create purchase order.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop with transition */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Drawer Container with slide transition */}
      <div
        className={`relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eef2f9] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1c2740]">New Purchase Order</h2>
            <p className="text-xs text-[#7d8aa1]">Record replenishment from suppliers into inventory</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[#7d8aa1] transition-colors hover:bg-[#f4f7fc] hover:text-[#1c2740]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-[#ffd5d9] bg-[#fff1f2] p-3 text-xs font-semibold text-[#d64545]">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* General Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "received" | "ordered")}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                >
                  <option value="received">Received (Adds Stock Now)</option>
                  <option value="ordered">Ordered (Pending Delivery)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Reference No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>
            </div>

            {/* Product Selector with Dropdown List & Images */}
            <div className="border-t border-[#eef2f9] pt-4" ref={dropdownRef}>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold text-[#1c2740]">
                  Choose Products <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#7d8aa1]">
                  Click to open catalog or type to filter
                </span>
              </div>

              <div className="relative">
                <div
                  className="flex h-11 w-full items-center rounded-lg border border-[#c5d0e2] bg-white px-3 transition focus-within:border-[#2f6fe8] focus-within:ring-2 focus-within:ring-[#2f6fe8]/20"
                  onClick={() => setProductDropdownOpen(true)}
                >
                  <Search size={16} className="text-[#6c7a93] shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="Search or click to select products..."
                    value={searchProduct}
                    onFocus={() => setProductDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchProduct(e.target.value);
                      setProductDropdownOpen(true);
                    }}
                    className="w-full text-xs font-medium text-[#1c2740] placeholder:text-[#9aa5b8] outline-none"
                  />
                  <ChevronDown size={16} className="text-[#7d8aa1] shrink-0 ml-2" />
                </div>

                {productDropdownOpen && (
                  <div className="absolute left-0 right-0 top-12 z-30 max-h-60 overflow-y-auto rounded-xl border border-[#dfe6f2] bg-white p-1.5 shadow-2xl">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[#7d8aa1]">No products found</p>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addItem(p)}
                          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-[#f4f7fc]"
                        >
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#7d8aa1]">
                                {p.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-bold text-[#1c2740]">{p.name}</p>
                            <p className="text-[11px] text-[#7d8aa1]">
                              SKU: {p.sku || "N/A"} · Stock: {p.stock_qty ?? 0} {p.unit || "pcs"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-[#2f6fe8]">
                              {money(p.cost_price || 0)}
                            </span>
                            <span className="block text-[10px] text-[#7d8aa1]">Cost Price</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c2740]">
                  Selected Order Items ({items.length})
                </span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[11px] font-semibold text-[#e5484d] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8e2ef] bg-[#fcfdfe] p-8 text-center">
                  <ShoppingBag className="mb-2 text-[#9bb0ce]" size={32} />
                  <p className="text-xs font-bold text-[#1c2740]">No items in this purchase order yet</p>
                  <p className="mt-0.5 text-[11px] text-[#7d8aa1]">
                    Click the product search box above to add items
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#dfe6f2]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f4f7fc] text-[#4b5872]">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">Product</th>
                        <th className="w-24 px-3 py-2.5 font-bold text-center">Qty</th>
                        <th className="w-28 px-3 py-2.5 font-bold text-center">Unit Cost ($)</th>
                        <th className="px-3 py-2.5 text-right font-bold">Line Total</th>
                        <th className="w-10 px-2 py-2.5 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef2f9]">
                      {items.map((i) => (
                        <tr key={i.product_id} className="hover:bg-[#fcfdfe]">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
                                {i.product?.image_url ? (
                                  <Image
                                    src={i.product.image_url}
                                    alt={i.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-[#7d8aa1]">
                                    {i.product?.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-[#1c2740]">
                                  {i.product?.name}
                                </p>
                                <p className="text-[10px] text-[#7d8aa1]">
                                  {i.product?.sku ? `SKU: ${i.product.sku}` : `${i.product?.unit || "pcs"}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={i.qty}
                              onChange={(e) => updateItemQty(i.product_id, parseFloat(e.target.value) || 1)}
                              className="h-8 w-full rounded border border-[#a8b8d0] bg-white px-2 text-center text-xs font-bold text-[#1c2740] focus:border-[#2f6fe8] focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={i.unit_cost}
                              onChange={(e) => updateItemCost(i.product_id, parseFloat(e.target.value) || 0)}
                              className="h-8 w-full rounded border border-[#a8b8d0] bg-white px-2 text-center text-xs font-bold text-[#1c2740] focus:border-[#2f6fe8] focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-extrabold text-[#1c2740]">
                            {money(i.qty * i.unit_cost)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(i.product_id)}
                              className="rounded p-1 text-[#e5484d] transition hover:bg-[#ffe9ec]"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Calculations & Payment with High-Contrast Inputs */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#e3ebf6] bg-[#f8fafc] p-4 text-xs sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#3d4a63]">Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value ? parseFloat(e.target.value) : "")}
                  className="h-9 w-full rounded-lg border border-[#b9c8de] bg-white px-2.5 text-xs font-bold text-[#1c2740] outline-none focus:border-[#2f6fe8]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#3d4a63]">Tax ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={tax}
                  onChange={(e) => setTax(e.target.value ? parseFloat(e.target.value) : "")}
                  className="h-9 w-full rounded-lg border border-[#b9c8de] bg-white px-2.5 text-xs font-bold text-[#1c2740] outline-none focus:border-[#2f6fe8]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#3d4a63]">Paid Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value ? parseFloat(e.target.value) : "")}
                  className="h-9 w-full rounded-lg border border-[#b9c8de] bg-white px-2.5 text-xs font-bold text-[#1c2740] outline-none focus:border-[#2f6fe8]"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">Note / Remarks</label>
              <textarea
                rows={2}
                placeholder="Optional supplier instructions or order remarks..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[#c5d0e2] bg-white p-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
              />
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="flex items-center justify-between border-t border-[#eef2f9] bg-[#fcfdfe] px-6 py-4">
            <div>
              <p className="text-[11px] font-medium text-[#7d8aa1]">Total Order Amount</p>
              <p className="text-xl font-extrabold text-[#2f6fe8]">{money(total)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#dfe6f2] bg-white px-4 py-2 text-xs font-semibold text-[#5d6b85] transition hover:bg-[#f4f7fc]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f6fe8] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5fe0] disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
