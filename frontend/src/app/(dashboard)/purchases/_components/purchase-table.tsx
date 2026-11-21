"use client";

import { Eye, CheckCircle2, Ban, Clock, AlertCircle } from "lucide-react";
import type { Purchase, PurchaseStatus } from "@/types/purchase";
import { money } from "@/libs/format";

interface PurchaseTableProps {
  purchases: Purchase[];
  loading: boolean;
  onView: (purchase: Purchase) => void;
  onReceive: (id: number) => void;
  onCancel: (id: number) => void;
  canManage?: boolean;
}

export function PurchaseTable({
  purchases,
  loading,
  onView,
  onReceive,
  onCancel,
  canManage = true,
}: PurchaseTableProps) {
  const statusBadges: Record<PurchaseStatus, { label: string; class: string }> = {
    received: {
      label: "Received",
      class: "bg-[#e3f6ea] text-[#1f9d55] border-[#b9eacc]",
    },
    ordered: {
      label: "Ordered",
      class: "bg-[#e8f0ff] text-[#2f6fe8] border-[#c0d6ff]",
    },
    cancelled: {
      label: "Cancelled",
      class: "bg-[#ffe9ec] text-[#e5484d] border-[#ffccd3]",
    },
  };

  if (!loading && purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f7fc] text-[#6c7a93]">
          <AlertCircle size={24} />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#1c2740]">No purchase orders found</p>
        <p className="mt-1 text-xs text-[#7d8aa1]">
          Try adjusting your search filters or create a new purchase order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-xs">
        <thead>
          <tr className="border-b border-[#eef2f9] bg-[#f8fafc] text-[#5d6b85]">
            <th className="px-4 py-3 font-semibold">Reference</th>
            <th className="px-4 py-3 font-semibold">Supplier</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold text-center">Items</th>
            <th className="px-4 py-3 font-semibold text-right">Total</th>
            <th className="px-4 py-3 font-semibold text-right">Paid</th>
            <th className="px-4 py-3 font-semibold text-center">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f9]">
          {purchases.map((purchase) => {
            const badge = statusBadges[purchase.status] || {
              label: purchase.status,
              class: "bg-[#f4f7fc] text-[#5d6b85]",
            };

            return (
              <tr key={purchase.id} className="transition-colors hover:bg-[#fcfdfe]">
                <td className="px-4 py-3.5">
                  <span className="font-bold text-[#1c2740]">{purchase.reference_no}</span>
                </td>

                <td className="px-4 py-3.5">
                  <p className="font-medium text-[#1c2740]">
                    {purchase.supplier?.name || "Direct Supplier"}
                  </p>
                  {purchase.user && (
                    <p className="text-[11px] text-[#7d8aa1]">by {purchase.user.name}</p>
                  )}
                </td>

                <td className="px-4 py-3.5 text-[#5d6b85]">
                  {purchase.purchased_at || "—"}
                </td>

                <td className="px-4 py-3.5 text-center text-[#5d6b85]">
                  <span className="rounded-md bg-[#f4f7fc] px-2 py-0.5 text-[11px] font-semibold text-[#1c2740]">
                    {purchase.items_count ?? purchase.items?.length ?? 0}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-right font-extrabold text-[#1c2740]">
                  {money(purchase.total)}
                </td>

                <td className="px-4 py-3.5 text-right font-medium text-[#1f9d55]">
                  {money(purchase.paid_amount)}
                </td>

                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.class}`}
                  >
                    {badge.label}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => onView(purchase)}
                      className="rounded-lg p-1.5 text-[#6c7a93] transition hover:bg-[#f4f7fc] hover:text-[#2f6fe8]"
                    >
                      <Eye size={16} />
                    </button>

                    {canManage && purchase.status === "ordered" && (
                      <>
                        <button
                          type="button"
                          title="Receive Order (Add Stock)"
                          onClick={() => onReceive(purchase.id)}
                          className="rounded-lg p-1.5 text-[#1f9d55] transition hover:bg-[#e3f6ea]"
                        >
                          <CheckCircle2 size={16} />
                        </button>

                        <button
                          type="button"
                          title="Cancel Order"
                          onClick={() => onCancel(purchase.id)}
                          className="rounded-lg p-1.5 text-[#e5484d] transition hover:bg-[#ffe9ec]"
                        >
                          <Ban size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
