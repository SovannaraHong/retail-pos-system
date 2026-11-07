"use client";

import { useEffect, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { SaleService } from "@/services/sale-service";
import type { KhqrPayment } from "@/types/sale";
import { focusRing, money } from "@/libs/format";

interface Props {
  payment: KhqrPayment;
  onPaid: (p: KhqrPayment) => void;
  onClose: () => void;
  onRetry: () => void;
}

const POLL_MS = 3000;
const PAID_SHOW_MS = 2200;
const COMPANY_NAME = "Retail POS"; // TODO: your shop name
const LOGO_SRC = "/qr/logo-white.png"; // TODO: header logo in public/qr/
const CENTER_SRC = "/qr/iconqr.png";
const RED = "#e1232e";

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const css = `
@keyframes khqr-pop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes khqr-draw{to{stroke-dashoffset:0}}
@keyframes khqr-ring{0%{transform:scale(.8);opacity:.55}100%{transform:scale(2);opacity:0}}
@keyframes khqr-bar{from{width:0}to{width:100%}}
@keyframes khqr-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
`;

export function KhqrModal({ payment, onPaid, onClose, onRetry }: Props) {
  const [p, setP] = useState(payment);
  const [left, setLeft] = useState(payment.seconds_left);
  const [cancelling, setCancelling] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [centerOk, setCenterOk] = useState(true);

  // poll the status while pending
  useEffect(() => {
    if (p.status !== "pending") return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const res = await SaleService.getKhqrById(p.id);
        if (stopped) return;
        setP((prev) => ({ ...prev, ...res.data, qr: res.data.qr ?? prev.qr }));
      } catch {
        // network hiccup: try again on the next tick
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [p.id, p.status]);

  // countdown (display only, the server decides when it expires)
  useEffect(() => {
    if (p.status !== "pending") return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [p.status]);

  // paid: show the success screen for a moment, then hand over
  useEffect(() => {
    if (p.status !== "paid") return;
    const t = setTimeout(() => onPaid(p), PAID_SHOW_MS);
    return () => clearTimeout(t);
  }, [p.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function closeAndCancel() {
    if (p.status === "pending") {
      setCancelling(true);
      try {
        await SaleService.cancelKhqr(p.id);
      } catch {
        // already paid / expired: nothing to cancel
      }
    }
    onClose();
  }

  const isImage = p.qr?.startsWith("data:image");

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <style>{css}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="KHQR payment"
        className="relative max-h-[95vh] w-full max-w-[340px] overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* ================= PENDING: KHQR card ================= */}
        {p.status === "pending" && (
          <>
            {/* red header */}
            <div
              className="flex h-16 items-center justify-center"
              style={{ background: RED }}
            >
              {logoOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={LOGO_SRC}
                  alt="KHQR"
                  className="h-5 w-auto"
                  onError={() => setLogoOk(false)}
                />
              ) : (
                <span className="text-2xl font-black tracking-wider text-white">
                  KHQR
                </span>
              )}
            </div>

            {/* folded corner */}
            <span
              aria-hidden
              className="absolute right-0 top-16 h-0 w-0 border-l-[26px] border-t-[26px] border-l-transparent"
              style={{ borderTopColor: RED }}
            />

            {/* name + amount */}
            <div className="px-7 pb-4 pt-5">
              <p className="text-sm text-[#1c2740]">{COMPANY_NAME}</p>
              <p className="mt-0.5 text-[25px] font-semibold leading-tight tabular-nums text-black">
                {money(p.amount)}
              </p>
            </div>

            <div className="mx-0 border-t border-dashed border-[#b9c0cc]" />

            {/* QR */}
            <div className="flex justify-center px-7 pb-3 pt-5">
              {p.qr ? (
                <div className="relative h-[236px] w-[236px]">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.qr} alt="KHQR code" className="h-full w-full" />
                  ) : (
                    <QRCodeSVG value={p.qr} size={236} level="H" />
                  )}

                  {/* center logo */}
                  {centerOk && (
                    <div className="absolute left-1/2 top-1/2 flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-[#e1232e] shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={CENTER_SRC}
                        alt=""
                        className="h-6 w-8 object-cover"
                        onError={() => setCenterOk(false)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-20 text-sm text-[#9aa5b8]">No QR returned.</p>
              )}
            </div>

            {/* status + cancel */}
            <div className="px-7 pb-6 text-center">
              <p className="text-[11px] text-[#9aa5b8]">Ref: {p.reference}</p>

              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-[#5d6b85]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for payment ·{" "}
                <span className="font-semibold tabular-nums">{mmss(left)}</span>
              </p>

              <button
                type="button"
                onClick={closeAndCancel}
                disabled={cancelling}
                className={`mt-4 w-full rounded-lg border border-[#dfe6f2] py-2.5 text-sm font-semibold text-[#3d4a63] hover:bg-[#f4f7fc] disabled:opacity-50 ${focusRing}`}
              >
                {cancelling ? "Cancelling…" : "Cancel payment"}
              </button>
            </div>
          </>
        )}

        {/* ================= PAID: success ================= */}
        {p.status === "paid" && (
          <div>
            <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-b from-[#22c55e] to-[#15a34a] pb-8 pt-10">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full bg-white/40"
                  style={{ animation: "khqr-ring 1.4s ease-out infinite" }}
                />
                <span
                  className="absolute inset-0 rounded-full bg-white/30"
                  style={{
                    animation: "khqr-ring 1.4s ease-out 0.5s infinite",
                  }}
                />
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg"
                  style={{ animation: "khqr-pop 0.5s ease-out both" }}
                >
                  <svg
                    viewBox="0 0 52 52"
                    className="h-12 w-12"
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
                      style={{
                        animation: "khqr-draw 0.45s ease-out 0.35s forwards",
                      }}
                    />
                  </svg>
                </div>
              </div>

              <h3
                className="mt-5 text-xl font-extrabold text-white"
                style={{ animation: "khqr-up 0.4s ease-out 0.5s both" }}
              >
                Payment received
              </h3>
              <p
                className="mt-1 text-4xl font-extrabold tabular-nums text-white"
                style={{ animation: "khqr-up 0.4s ease-out 0.6s both" }}
              >
                {money(p.amount)}
              </p>
            </div>

            {/* receipt-style details */}
            <div
              className="px-7 pb-6 pt-5"
              style={{ animation: "khqr-up 0.4s ease-out 0.75s both" }}
            >
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-[#6c7a93]">
                  <dt>Method</dt>
                  <dd className="font-semibold text-[#1c2740]">KHQR</dd>
                </div>
                {p.from_account && (
                  <div className="flex justify-between gap-3 text-[#6c7a93]">
                    <dt>From</dt>
                    <dd className="truncate font-semibold text-[#1c2740]">
                      {p.from_account}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-3 text-[#6c7a93]">
                  <dt>Ref</dt>
                  <dd className="truncate font-semibold text-[#1c2740]">
                    {p.reference}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e8f7ee]">
                <div
                  className="h-full rounded-full bg-[#22c55e]"
                  style={{
                    animation: `khqr-bar ${PAID_SHOW_MS}ms linear forwards`,
                  }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-[#7d8aa1]">
                Finishing your sale…
              </p>
            </div>
          </div>
        )}

        {/* ================= EXPIRED / CANCELLED / REVIEW ================= */}
        {(p.status === "expired" ||
          p.status === "cancelled" ||
          p.status === "needs_review") && (
          <div className="px-7 py-8 text-center">
            <XCircle className="mx-auto h-14 w-14 text-[#e5484d]" />
            <h3 className="mt-4 text-lg font-extrabold text-[#1c2740]">
              {p.status === "expired"
                ? "QR code expired"
                : p.status === "cancelled"
                  ? "Payment cancelled"
                  : "Needs review"}
            </h3>
            <p className="mt-1 text-sm text-[#6c7a93]">
              {p.status === "needs_review"
                ? "The payment could not be confirmed automatically. Check the KHQR payments list before retrying."
                : (p.error ?? "No money was taken. You can generate a new QR.")}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 rounded-lg border border-[#dfe6f2] py-2.5 text-sm font-semibold text-[#3d4a63] hover:bg-[#f4f7fc] ${focusRing}`}
              >
                Close
              </button>
              {p.status !== "needs_review" && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={`flex-1 rounded-lg bg-[#2f6fe8] py-2.5 text-sm font-semibold text-white hover:bg-[#1d5fe0] ${focusRing}`}
                >
                  New QR
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
