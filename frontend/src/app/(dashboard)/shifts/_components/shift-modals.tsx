"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";
import { ShiftService } from "@/services/shift-service";
import type { Shift } from "@/types/shift";
import { parseApiError } from "@/libs/api-error";
import { focusRing, money } from "@/libs/format";

const input =
  "h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm tabular-nums text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

const textarea =
  "w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1c2740]/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#1c2740]">{title}</h3>
          {onClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={`rounded-md p-1 text-[#9aa5b8] hover:bg-[#f4f7fc] ${focusRing}`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg bg-[#ffe9ec] px-3 py-2 text-sm text-[#e5484d]"
    >
      {text}
    </p>
  );
}

/* ---------------------------- OPEN SHIFT ---------------------------- */

export function OpenShiftModal({
  onOpened,
  onClose,
}: {
  onOpened: (shift: Shift) => void;
  onClose: () => void;
}) {
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const amount = Number(cash);
  const valid = cash.trim() !== "" && Number.isFinite(amount) && amount >= 0;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await ShiftService.open({
        opening_cash: amount,
        note: note.trim() || undefined,
      });
      onOpened(res.data);
    } catch (err) {
      setError(parseApiError(err).message);
      setBusy(false);
    }
  }

  return (
    <Overlay title="Open shift" onClose={onClose}>
      <p className="mb-4 text-sm text-[#6c7a93]">
        Count the cash in the drawer and enter it to start selling.
      </p>

      <label className="mb-1 block text-sm font-semibold text-[#1c2740]">
        Opening cash
      </label>
      <input
        type="number"
        min="0"
        step="0.01"
        autoFocus
        value={cash}
        onChange={(e) => setCash(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="0.00"
        className={input}
      />

      <label className="mb-1 mt-4 block text-sm font-semibold text-[#1c2740]">
        Note (optional)
      </label>
      <textarea
        value={note}
        maxLength={500}
        rows={2}
        onChange={(e) => setNote(e.target.value)}
        className={textarea}
      />

      {error && (
        <div className="mt-3">
          <ErrorBox text={error} />
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#6c7a93] hover:bg-[#f4f7fc] ${focusRing}`}
        >
          Not now
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!valid || busy}
          className={`inline-flex items-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d5fe0] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Open shift
        </button>
      </div>
    </Overlay>
  );
}

/* ---------------------------- CLOSE SHIFT ---------------------------- */

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm text-[#8a96ab]">
      <span>{label}</span>
      <span
        className={`tabular-nums ${
          strong ? "font-extrabold text-[#1c2740]" : "font-bold text-[#1c2740]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function CloseShiftModal({
  onClosed,
  onClose,
}: {
  onClosed: (shift: Shift) => void;
  onClose: () => void;
}) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loadError, setLoadError] = useState("");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // load fresh totals every time the modal opens
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    ShiftService.current(controller.signal)
      .then((s) => {
        if (cancelled) return;
        if (s) setShift(s);
        else setLoadError("You have no open shift.");
      })
      .catch((err) => {
        if (!cancelled) setLoadError(parseApiError(err).message);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const summary = shift?.summary;
  const amount = Number(counted);
  const valid = counted.trim() !== "" && Number.isFinite(amount) && amount >= 0;
  const expected = summary?.expected_cash ?? 0;
  const diff = valid ? Math.round((amount - expected) * 100) / 100 : 0;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await ShiftService.close({
        closing_cash: amount,
        note: note.trim() || undefined,
      });
      onClosed(res.data);
    } catch (err) {
      setError(parseApiError(err).message);
      setBusy(false);
    }
  }

  return (
    <Overlay title="Close shift" onClose={onClose}>
      {loadError ? (
        <>
          <ErrorBox text={loadError} />
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#6c7a93] hover:bg-[#f4f7fc] ${focusRing}`}
            >
              Close
            </button>
          </div>
        </>
      ) : !shift || !summary ? (
        <div className="flex justify-center py-10 text-[#9aa5b8]">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2 rounded-xl bg-[#f4f7fc] p-4">
            <Row label="Opening cash" value={money(shift.opening_cash)} />
            <Row label="Cash sales" value={money(summary.cash_sales)} />
            <Row
              label="Cash refunds"
              value={`- ${money(summary.cash_refunds)}`}
            />
            <div className="border-t border-[#dfe6f2] pt-2">
              <Row
                label="Expected cash"
                value={money(summary.expected_cash)}
                strong
              />
            </div>
            <div className="space-y-2 border-t border-[#dfe6f2] pt-2">
              <Row label="Sales" value={`${summary.sales_count}`} />
              <Row label="Sales total" value={money(summary.sales_total)} />
              {Object.entries(summary.by_method).map(([m, v]) => (
                <Row key={m} label={m.toUpperCase()} value={money(v)} />
              ))}
            </div>
          </div>

          <label className="mb-1 mt-4 block text-sm font-semibold text-[#1c2740]">
            Cash counted in drawer
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={expected.toFixed(2)}
            className={input}
          />

          {valid && (
            <p
              className={`mt-2 text-sm font-bold ${
                diff === 0
                  ? "text-[#1f9d55]"
                  : diff > 0
                    ? "text-[#d97706]"
                    : "text-[#e5484d]"
              }`}
            >
              {diff === 0
                ? "Cash matches."
                : diff > 0
                  ? `Over by ${money(diff)}`
                  : `Short by ${money(Math.abs(diff))}`}
            </p>
          )}

          <label className="mb-1 mt-4 block text-sm font-semibold text-[#1c2740]">
            Note (optional)
          </label>
          <textarea
            value={note}
            maxLength={500}
            rows={2}
            onChange={(e) => setNote(e.target.value)}
            className={textarea}
          />

          {error && (
            <div className="mt-3">
              <ErrorBox text={error} />
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#6c7a93] hover:bg-[#f4f7fc] ${focusRing}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!valid || busy}
              className={`inline-flex items-center gap-2 rounded-lg bg-[#e5484d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#cf3a3f] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Close shift
            </button>
          </div>
        </>
      )}
    </Overlay>
  );
}
