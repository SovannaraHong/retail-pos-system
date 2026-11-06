"use client";

import { useEffect } from "react";
import { Pencil, Truck, X } from "lucide-react";
import type { Supplier } from "@/types/supplier";
import { focusRing } from "@/libs/format";

interface Props {
  supplier: Supplier;
  canEdit: boolean;
  onEdit: (s: Supplier) => void;
  onClose: () => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-[#7d8aa1]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-[#1c2740]">
        {children || "—"}
      </dd>
    </div>
  );
}

export function SupplierDetailModal({
  supplier: s,
  canEdit,
  onEdit,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${s.name} details`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 border-b border-[#f0f3f9] p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2f6fe8]">
            <Truck className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-extrabold text-[#1c2740]">
              {s.name}
            </h3>
            <span
              className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                s.is_active
                  ? "bg-[#e3f7ec] text-[#1f9d55]"
                  : "bg-[#eef1f7] text-[#5d6b85]"
              }`}
            >
              {s.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`rounded-lg p-2 text-[#7d8aa1] hover:bg-[#f1f5fd] ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-5">
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Contact person">{s.contact_person}</Field>
            <Field label="Products">{s.products_count}</Field>
            <Field label="Phone">{s.phone}</Field>
            <Field label="Email">{s.email}</Field>
          </dl>

          {s.address && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
                Address
              </h4>
              <p className="whitespace-pre-line text-sm text-[#3d4a63]">
                {s.address}
              </p>
            </section>
          )}

          {s.note && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
                Note
              </h4>
              <p className="whitespace-pre-line text-sm text-[#3d4a63]">
                {s.note}
              </p>
            </section>
          )}

          <dl className="grid grid-cols-2 gap-4 border-t border-[#f0f3f9] pt-4">
            <Field label="Created">{formatDate(s.created_at)}</Field>
            <Field label="Last updated">{formatDate(s.updated_at)}</Field>
          </dl>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f0f3f9] bg-[#f8faff] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#3d4a63] hover:bg-[#eef1f7] ${focusRing}`}
          >
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(s)}
              className={`inline-flex items-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d5fe0] ${focusRing}`}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
