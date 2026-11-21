"use client";

import { useEffect, useRef } from "react";
import { X, Calendar, User, Truck, CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react";
import type { Purchase } from "@/types/purchase";
import { money } from "@/libs/format";

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  open: boolean;
  onClose: () => void;
  onReceive?: (id: number) => void;
  onCancel?: (id: number) => void;
  canManage?: boolean;
}

export function PurchaseDetailModal({
  purchase,
  open,
  onClose,
  onReceive,
  onCancel,
  canManage = true,
}: PurchaseDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !purchase) return null;

  const statusConfig = {
    received: {
      label: "Received",
      bg: "bg-[#e3f6ea] text-[#1f9d55] border-[#b9eacc]",
      icon: CheckCircle2,
    },
    ordered: {
      label: "Ordered (Pending)",
      bg: "bg-[#e8f0ff] text-[#2f6fe8] border-[#c0d6ff]",
      icon: Clock,
    },
    cancelled: {
      label: "Cancelled",
      bg: "bg-[#ffe9ec] text-[#e5484d] border-[#ffccd3]",
      icon: Ban,
    },
  }[purchase.status] || {
    label: purchase.status,
    bg: "bg-[#f4f7fc] text-[#5d6b85] border-[#dfe6f2]",
    icon: AlertCircle,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        ref={modalRef}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eef2f9] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#1c2740]">
              Purchase Order: {purchase.reference_no}
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bg}`}
            >
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7d8aa1] transition-colors hover:bg-[#f4f7fc] hover:text-[#1c2740]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#f8fafc] p-4 text-xs sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <Truck size={16} className="text-[#6c7a93]" />
              <div>
                <p className="text-[#7d8aa1]">Supplier</p>
                <p className="font-semibold text-[#1c2740]">
                  {purchase.supplier?.name || "Direct Supplier"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar size={16} className="text-[#6c7a93]" />
              <div>
                <p className="text-[#7d8aa1]">Purchased Date</p>
                <p className="font-semibold text-[#1c2740]">
                  {purchase.purchased_at || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <User size={16} className="text-[#6c7a93]" />
              <div>
                <p className="text-[#7d8aa1]">Created By</p>
                <p className="font-semibold text-[#1c2740]">
                  {purchase.user?.name || "System"}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#1c2740]">
              Ordered Items ({purchase.items?.length || 0})
            </h3>
            <div className="overflow-hidden rounded-xl border border-[#eef2f9]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#5d6b85]">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">Product</th>
                    <th className="px-3.5 py-2.5 font-medium text-center">Unit</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">Qty</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">Unit Cost</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f9]">
                  {purchase.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#fcfdfd]">
                      <td className="px-3.5 py-3">
                        <p className="font-semibold text-[#1c2740]">
                          {item.product?.name || `Product #${item.id}`}
                        </p>
                        {item.product?.sku && (
                          <p className="text-[11px] text-[#7d8aa1]">
                            SKU: {item.product.sku}
                          </p>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center text-[#5d6b85]">
                        {item.product?.unit || "pcs"}
                      </td>
                      <td className="px-3.5 py-3 text-right font-medium text-[#1c2740]">
                        {item.qty}
                      </td>
                      <td className="px-3.5 py-3 text-right text-[#5d6b85]">
                        {money(item.unit_cost)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-[#1c2740]">
                        {money(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Summary */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-[#5d6b85]">Note</p>
              <div className="min-h-[80px] rounded-xl border border-[#eef2f9] bg-[#fcfdfe] p-3 text-xs text-[#5d6b85]">
                {purchase.note || "No notes provided for this purchase order."}
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-[#f8fafc] p-4 text-xs">
              <div className="flex justify-between text-[#5d6b85]">
                <span>Subtotal</span>
                <span>{money(purchase.subtotal)}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-[#e5484d]">
                  <span>Discount</span>
                  <span>- {money(purchase.discount)}</span>
                </div>
              )}
              {purchase.tax > 0 && (
                <div className="flex justify-between text-[#5d6b85]">
                  <span>Tax</span>
                  <span>+ {money(purchase.tax)}</span>
                </div>
              )}
              <div className="border-t border-[#e2e8f0] pt-2 flex justify-between font-bold text-sm text-[#1c2740]">
                <span>Grand Total</span>
                <span>{money(purchase.total)}</span>
              </div>
              <div className="flex justify-between text-[#1f9d55] font-medium pt-1">
                <span>Paid Amount</span>
                <span>{money(purchase.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-[#d64545] font-medium">
                <span>Remaining Balance</span>
                <span>{money(purchase.balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#eef2f9] px-6 py-4">
          <div className="flex items-center gap-2">
            {canManage && purchase.status === "ordered" && onReceive && (
              <button
                type="button"
                onClick={() => onReceive(purchase.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#22b35e] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1a934c]"
              >
                <CheckCircle2 size={15} />
                Receive Stock
              </button>
            )}

            {canManage && purchase.status === "ordered" && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(purchase.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffd5d9] bg-[#fff1f2] px-3.5 py-2 text-xs font-semibold text-[#e5484d] transition hover:bg-[#ffe3e6]"
              >
                <Ban size={15} />
                Cancel Order
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#dfe6f2] bg-white px-4 py-2 text-xs font-semibold text-[#5d6b85] transition hover:bg-[#f4f7fc] hover:text-[#1c2740]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
