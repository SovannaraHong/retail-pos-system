"use client";

import { Banknote, QrCode } from "lucide-react";
import { focusRing, money } from "@/libs/format";

export interface ReceiptData {
  invoice: string;
  method: string;
  total: number;
  paid: number;
  change: number;
}

const css = `
@keyframes rc-pop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes rc-draw{to{stroke-dashoffset:0}}
@keyframes rc-ring{0%{transform:scale(.8);opacity:.55}100%{transform:scale(2);opacity:0}}
@keyframes rc-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
`;

export function ReceiptModal({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose: () => void;
}) {
  const MethodIcon = data.method === "KHQR" ? QrCode : Banknote;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <style>{css}</style>

      {/* card: soft gray background (easy on the eyes, not white) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sale completed"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#e6eaf2] shadow-2xl"
      >
        {/* colorful header */}
        <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#0f8a43] pb-8 pt-9">
          <span className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <span className="absolute -right-6 top-10 h-20 w-20 rounded-full bg-white/10" />

          <div className="relative flex h-20 w-20 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-white/40"
              style={{ animation: "rc-ring 1.4s ease-out infinite" }}
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg"
              style={{ animation: "rc-pop 0.5s ease-out both" }}
            >
              <svg
                viewBox="0 0 52 52"
                className="h-10 w-10"
                fill="none"
                stroke="#16a34a"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M14 27 L23 36 L39 17"
                  strokeDasharray="40"
                  strokeDashoffset="40"
                  style={{ animation: "rc-draw 0.45s ease-out 0.35s forwards" }}
                />
              </svg>
            </div>
          </div>

          <h3
            className="mt-4 text-xl font-extrabold text-white"
            style={{ animation: "rc-up 0.4s ease-out 0.45s both" }}
          >
            Sale completed
          </h3>
          <p
            className="mt-1 text-4xl font-extrabold tabular-nums text-white"
            style={{ animation: "rc-up 0.4s ease-out 0.55s both" }}
          >
            {money(data.total)}
          </p>
          <span
            className="mt-3 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
            style={{ animation: "rc-up 0.4s ease-out 0.65s both" }}
          >
            {data.invoice}
          </span>
        </div>

        {/* ticket notches + dashed line */}
        <div className="relative">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-black/60" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-black/60" />
          <div className="mx-5 border-t-2 border-dashed border-[#b4bfd3]" />
        </div>

        {/* details */}
        <div
          className="px-6 pb-6 pt-4"
          style={{ animation: "rc-up 0.4s ease-out 0.75s both" }}
        >
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between text-[#5d6b85]">
              <dt>Method</dt>
              <dd className="flex items-center gap-1.5 rounded-full bg-[#d3e2fd] px-3 py-1 font-semibold text-[#1d5fe0]">
                <MethodIcon className="h-4 w-4" />
                {data.method}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#d8deea] px-3 py-2.5 text-[#5d6b85]">
              <dt>Total</dt>
              <dd className="font-bold tabular-nums text-[#1c2740]">
                {money(data.total)}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#d3e2fd] px-3 py-2.5 text-[#1d5fe0]">
              <dt>Paid</dt>
              <dd className="font-bold tabular-nums">{money(data.paid)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#cdeedb] px-3 py-2.5 text-[#15803d]">
              <dt className="font-semibold">Change</dt>
              <dd className="text-lg font-extrabold tabular-nums">
                {money(data.change)}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            autoFocus
            onClick={onClose}
            className={`mt-5 w-full rounded-xl bg-gradient-to-r from-[#2f6fe8] to-[#1d5fe0] py-3 text-sm font-bold text-white shadow-md hover:brightness-110 ${focusRing}`}
          >
            New order
          </button>
        </div>
      </div>
    </div>
  );
}
