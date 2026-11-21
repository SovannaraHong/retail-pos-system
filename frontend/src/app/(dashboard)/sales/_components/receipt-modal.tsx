"use client";

import { useRef, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Printer,
  QrCode,
  Receipt,
  X,
  Volume2,
  AlertTriangle,
} from "lucide-react";
import { focusRing, money } from "@/libs/format";
import { useStoreSettings } from "@/hooks/use-store-settings";

export interface ReceiptItemLine {
  id?: number;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface ReceiptData {
  invoice: string;
  method: string;
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  paid: number;
  change: number;
  date?: string;
  cashierName?: string;
  items?: ReceiptItemLine[];
  lowStockItems?: Array<{ name: string; remaining: number }>;
}

export function ReceiptModal({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose: () => void;
}) {
  const { settings } = useStoreSettings();
  const [activeTab, setActiveTab] = useState<"summary" | "slip">("summary");
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  const MethodIcon = data.method.toLowerCase().includes("qr") ? QrCode : Banknote;
  const storeName = settings?.store_name || "RETAIL POS";
  const storeAddress = settings?.store_address || "Phnom Penh, Cambodia";
  const storePhone = settings?.store_phone || "+855 (0) 12 345 678";
  const taxId = settings?.tax_id;
  const receiptHeader = settings?.receipt_header;
  const receiptFooter = settings?.receipt_footer || "Thank you for shopping with us! Please come again.";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      {/* Print Specific CSS - Ensures pure thermal 80mm receipt printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-print-area, #thermal-receipt-print-area * {
            visibility: visible;
          }
          #thermal-receipt-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
            margin: 0;
            background: #fff !important;
            color: #000 !important;
            font-family: monospace !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Payment Successful"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#e6eaf2] shadow-2xl"
      >
        {/* Top Success Banner */}
        <div className="relative flex flex-col items-center bg-gradient-to-br from-[#16a34a] via-[#15803d] to-[#0f766e] px-6 pb-6 pt-7 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X size={18} />
          </button>

          {/* Animated Success Badge */}
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
            <CheckCircle2 className="h-9 w-9 text-[#16a34a]" />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100">
            <Volume2 className="h-3.5 w-3.5 text-emerald-200" /> Payment Received
          </div>
          <h2 className="mt-0.5 text-2xl font-extrabold tracking-tight">
            {money(data.total)}
          </h2>
          <span className="mt-2 rounded-full bg-white/20 px-3 py-0.5 font-mono text-xs font-semibold">
            {data.invoice}
          </span>
        </div>

        {/* Low Stock Warning Alert if any item reached low stock */}
        {data.lowStockItems && data.lowStockItems.length > 0 && (
          <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-[#fef9ee] p-3 text-amber-900 shadow-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-xs">
              <p className="font-bold text-amber-800">Low Stock Notice:</p>
              <div className="mt-0.5 space-y-0.5">
                {data.lowStockItems.map((item, idx) => (
                  <p key={idx}>
                    <span className="font-semibold">{item.name}</span> has only{" "}
                    <span className="font-bold text-amber-700">{item.remaining} left</span>.
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher: Quick Summary vs Real Thermal Receipt Slip */}
        <div className="flex border-b border-[#cbd5e1] bg-white px-4 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "summary"
                ? "border-[#2f6fe8] text-[#2f6fe8]"
                : "border-transparent text-[#64748b] hover:text-[#1c2740]"
            }`}
          >
            <Banknote className="h-4 w-4" />
            Payment Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("slip")}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "slip"
                ? "border-[#2f6fe8] text-[#2f6fe8]"
                : "border-transparent text-[#64748b] hover:text-[#1c2740]"
            }`}
          >
            <Receipt className="h-4 w-4" />
            Printable Receipt
          </button>
        </div>

        {/* Body View 1: Quick Summary */}
        {activeTab === "summary" && (
          <div className="overflow-y-auto p-5">
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#5d6b85]">
                <dt>Payment Method</dt>
                <dd className="flex items-center gap-1.5 rounded-full bg-[#d3e2fd] px-3 py-1 font-semibold text-[#1d5fe0]">
                  <MethodIcon className="h-3.5 w-3.5" />
                  {data.method}
                </dd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#d8deea] px-3.5 py-2.5 text-[#5d6b85]">
                <dt>Invoice Total</dt>
                <dd className="text-sm font-bold tabular-nums text-[#1c2740]">
                  {money(data.total)}
                </dd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#d3e2fd] px-3.5 py-2.5 text-[#1d5fe0]">
                <dt>Amount Paid</dt>
                <dd className="text-sm font-bold tabular-nums">{money(data.paid)}</dd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#cdeedb] px-3.5 py-2.5 text-[#15803d]">
                <dt className="font-semibold">Change Returned</dt>
                <dd className="text-base font-extrabold tabular-nums">
                  {money(data.change)}
                </dd>
              </div>
            </dl>

            {/* Quick list of purchased items if available */}
            {data.items && data.items.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#cbd5e1] bg-white p-3.5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#7a889b]">
                  Purchased Items ({data.items.length})
                </p>
                <div className="max-h-32 space-y-1.5 overflow-y-auto text-xs [scrollbar-width:thin]">
                  {data.items.map((line, i) => (
                    <div key={i} className="flex justify-between text-[#2d3748]">
                      <span className="truncate pr-2">
                        {line.qty}x {line.product_name}
                      </span>
                      <span className="font-semibold tabular-nums text-[#1c2740]">
                        {money(line.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body View 2: Realistic Thermal Receipt (Printable) */}
        {activeTab === "slip" && (
          <div className="overflow-y-auto p-4 [scrollbar-width:thin]">
            <div
              id="thermal-receipt-print-area"
              ref={receiptPrintRef}
              className="rounded-xl border border-dashed border-[#b6c2d6] bg-white p-5 font-mono text-[11px] text-[#1c2740] shadow-sm"
            >
              {/* Header */}
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-wider">{storeName}</p>
                <p className="mt-0.5 text-[10px] text-[#55627a]">{storeAddress}</p>
                <p className="text-[10px] text-[#55627a]">Tel: {storePhone}</p>
                {taxId && <p className="text-[10px] text-[#55627a]">VAT/TIN: {taxId}</p>}
                {receiptHeader && (
                  <p className="mt-1 text-[10px] italic text-[#1d5fe0]">{receiptHeader}</p>
                )}
              </div>

              <div className="my-2.5 border-t border-dashed border-[#a3b1c6]" />

              {/* Receipt Metadata */}
              <div className="space-y-0.5 text-[10px] text-[#4a5568]">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="font-bold">{data.invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{data.date || new Date().toLocaleString()}</span>
                </div>
                {data.cashierName && (
                  <div className="flex justify-between">
                    <span>CASHIER:</span>
                    <span>{data.cashierName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PAYMENT:</span>
                  <span className="font-bold uppercase">{data.method}</span>
                </div>
              </div>

              <div className="my-2.5 border-t border-dashed border-[#a3b1c6]" />

              {/* Items Table */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between font-bold text-[#334155]">
                  <span>ITEM / QTY</span>
                  <span>AMOUNT</span>
                </div>
                {data.items && data.items.length > 0 ? (
                  data.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10.5px]">
                      <span className="truncate pr-2">
                        {it.product_name} <span className="text-[#64748b]">x{it.qty}</span>
                      </span>
                      <span className="tabular-nums font-semibold">{money(it.line_total)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-[10.5px]">
                    <span>Sale Transaction</span>
                    <span>{money(data.total)}</span>
                  </div>
                )}
              </div>

              <div className="my-2.5 border-t border-dashed border-[#a3b1c6]" />

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                {data.subtotal !== undefined && data.subtotal !== data.total && (
                  <div className="flex justify-between text-[#64748b]">
                    <span>Subtotal</span>
                    <span>{money(data.subtotal)}</span>
                  </div>
                )}
                {!!data.discount && (
                  <div className="flex justify-between text-[#16a34a]">
                    <span>Discount</span>
                    <span>-{money(data.discount)}</span>
                  </div>
                )}
                {!!data.tax && (
                  <div className="flex justify-between text-[#64748b]">
                    <span>Tax</span>
                    <span>+{money(data.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black">
                  <span>TOTAL DUE</span>
                  <span className="text-sm font-extrabold">{money(data.total)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1d5fe0]">
                  <span>PAID ({data.method})</span>
                  <span>{money(data.paid)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#15803d]">
                  <span>CHANGE</span>
                  <span>{money(data.change)}</span>
                </div>
              </div>

              <div className="my-2.5 border-t border-dashed border-[#a3b1c6]" />

              {/* Footer */}
              <div className="text-center text-[10px] text-[#64748b]">
                <p>{receiptFooter}</p>
                <p className="mt-1 font-mono text-[9px] text-[#94a3b8]">*** End of Receipt ***</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center gap-2.5 border-t border-[#cbd5e1] bg-white p-4">
          <button
            type="button"
            onClick={handlePrint}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white py-2.5 text-xs font-bold text-[#1c2740] shadow-sm hover:bg-[#f1f5f9] ${focusRing}`}
          >
            <Printer className="h-4 w-4 text-[#2f6fe8]" />
            Print Receipt
          </button>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className={`flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#2f6fe8] to-[#1d5fe0] py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 ${focusRing}`}
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}
