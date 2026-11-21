"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Search, AlertCircle, ShoppingBag } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suppliers & Products for selection
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchProduct, setSearchProduct] = useState("");

  // Form State
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [status, setStatus] = useState<"received" | "ordered">("received");
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNo, setReferenceNo] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      SupplierService.getAll({ per_page: 100 })
        .then((res) => setSuppliers(res.data || []))
        .catch(() => {});
      ProductService.getAll({ per_page: 200 })
        .then((res) => setProducts(res.data || []))
        .catch(() => {});
    } else {
      document.body.style.overflow = "";
      // reset
      setSupplierId("");
      setStatus("received");
      setReferenceNo("");
      setDiscount(0);
      setTax(0);
      setPaidAmount(0);
      setNote("");
      setItems([]);
      setError(null);
    }
  }, [open]);

  // Filter products for quick add dropdown
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchProduct.toLowerCase())
  );

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
          unit_cost: product.cost_price || 0,
        },
      ]);
    }
    setSearchProduct("");
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
  const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one product item.");
      return;
    }

    if (paidAmount > total) {
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
        paid_amount: Number(paidAmount) || 0,
        note: note.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: Number(i.qty),
          unit_cost: Number(i.unit_cost),
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create purchase order.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eef2f9] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1c2740]">New Purchase Order</h2>
            <p className="text-xs text-[#7d8aa1]">Record stock replenishment from suppliers</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7d8aa1] transition-colors hover:bg-[#f4f7fc] hover:text-[#1c2740]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-[#ffd5d9] bg-[#fff1f2] p-3 text-xs font-medium text-[#d64545]">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* General Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1c2740]">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}
                  className="h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] px-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
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
                <label className="mb-1.5 block text-xs font-semibold text-[#1c2740]">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] px-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1c2740]">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "received" | "ordered")}
                  className="h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] px-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
                >
                  <option value="received">Received (Adds Stock Now)</option>
                  <option value="ordered">Ordered (Pending Delivery)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1c2740]">
                  Reference No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] px-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
                />
              </div>
            </div>

            {/* Product Selector */}
            <div className="border-t border-[#eef2f9] pt-4">
              <label className="mb-1.5 block text-xs font-semibold text-[#1c2740]">
                Add Products <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-[#7d8aa1]" />
                <input
                  type="text"
                  placeholder="Search product name or SKU..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] pl-9 pr-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
                />

                {searchProduct.trim() && (
                  <div className="absolute left-0 right-0 top-11 z-20 max-h-48 overflow-y-auto rounded-xl border border-[#dfe6f2] bg-white shadow-xl">
                    {filteredProducts.length === 0 ? (
                      <p className="p-3 text-center text-xs text-[#7d8aa1]">No products found</p>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addItem(p)}
                          className="flex w-full items-center justify-between border-b border-[#f4f7fc] p-2.5 text-left text-xs transition hover:bg-[#f8fafc]"
                        >
                          <div>
                            <p className="font-semibold text-[#1c2740]">{p.name}</p>
                            <p className="text-[11px] text-[#7d8aa1]">SKU: {p.sku || "N/A"}</p>
                          </div>
                          <span className="font-semibold text-[#2f6fe8]">
                            {money(p.cost_price || 0)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e2e8f0] p-6 text-center">
                  <ShoppingBag className="mb-2 text-[#a0aec0]" size={28} />
                  <p className="text-xs font-medium text-[#7d8aa1]">No products added yet</p>
                  <p className="text-[11px] text-[#a0aec0]">Search above to add items to this order</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#eef2f9]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] text-[#5d6b85]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="w-24 px-3 py-2 font-medium">Qty</th>
                        <th className="w-28 px-3 py-2 font-medium">Unit Cost</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                        <th className="w-10 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef2f9]">
                      {items.map((i) => (
                        <tr key={i.product_id}>
                          <td className="px-3 py-2.5 font-medium text-[#1c2740]">
                            {i.product?.name}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={i.qty}
                              onChange={(e) => updateItemQty(i.product_id, parseFloat(e.target.value) || 1)}
                              className="h-8 w-full rounded border border-[#dfe6f2] px-2 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={i.unit_cost}
                              onChange={(e) => updateItemCost(i.product_id, parseFloat(e.target.value) || 0)}
                              className="h-8 w-full rounded border border-[#dfe6f2] px-2 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-[#1c2740]">
                            {money(i.qty * i.unit_cost)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(i.product_id)}
                              className="text-[#e5484d] hover:text-[#d64545]"
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

            {/* Calculations & Payment */}
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#f8fafc] p-4 text-xs sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5d6b85]">Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="h-9 w-full rounded border border-[#dfe6f2] bg-white px-2.5 text-xs text-[#1c2740]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5d6b85]">Tax ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="h-9 w-full rounded border border-[#dfe6f2] bg-white px-2.5 text-xs text-[#1c2740]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5d6b85]">Paid Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 w-full rounded border border-[#dfe6f2] bg-white px-2.5 text-xs text-[#1c2740]"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1c2740]">Note</label>
              <textarea
                rows={2}
                placeholder="Optional purchase details or payment notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] p-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
              />
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="flex items-center justify-between border-t border-[#eef2f9] bg-[#fcfdfe] px-6 py-4">
            <div>
              <p className="text-[11px] text-[#7d8aa1]">Total Amount</p>
              <p className="text-lg font-extrabold text-[#2f6fe8]">{money(total)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#dfe6f2] bg-white px-4 py-2 text-xs font-semibold text-[#5d6b85] transition hover:bg-[#f4f7fc]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f6fe8] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5fe0] disabled:opacity-50"
              >
                {loading ? "Saving..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
