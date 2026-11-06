"use client";

import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { focusRing } from "@/libs/format";

interface Props {
  count: number;
  name?: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDelete({
  count,
  name,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  const { open, close } = useOverlayTransition(onCancel, 200);
  const cancel = busy ? undefined : close;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={cancel}
        className={`absolute inset-0 bg-[#0f1a33]/45 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3 className="text-base font-bold text-[#1c2740]">
          {count === 1
            ? `Delete ${name ?? "this product"}?`
            : `Delete ${count} products?`}
        </h3>
        <p className="mt-2 text-sm text-[#6c7a93]">
          {count === 1 ? "It" : "They"} will be removed from your product list.
          Sales history stays intact.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className={`rounded-lg border border-[#dfe6f2] px-4 py-2 text-sm font-medium text-[#3d4a63] hover:bg-[#f4f7fc] disabled:opacity-50 ${focusRing}`}
          >
            Keep
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg bg-[#e5484d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#cf3a3f] disabled:opacity-60 ${focusRing}`}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
