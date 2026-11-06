"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SupplierService } from "@/services/supplier-service";
import type { Supplier } from "@/types/supplier";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";

const DURATION = 300;

interface Props {
  supplier: Supplier | null; // null = create
  onClose: () => void;
  onSaved: (mode: "created" | "updated") => void;
}

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2.5 text-sm text-[#1c2740] placeholder:text-[#9aa5b8] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const checkboxCls =
  "h-4 w-4 rounded border-[#c5cddb] text-[#2f6fe8] focus:ring-[#2f6fe8]";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-[#3d4a63]">
      {label}
      {children}
      {error && (
        <span className="mt-1 block text-xs font-normal text-[#e5484d]">
          {error}
        </span>
      )}
    </label>
  );
}

export function SupplierDrawer({ supplier, onClose, onSaved }: Props) {
  const isEdit = supplier !== null;
  const { open, close } = useOverlayTransition(onClose, DURATION);

  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    contact_person: supplier?.contact_person ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    note: supplier?.note ?? "",
    is_active: supplier?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, saving]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const setText =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const local: Record<string, string> = {};
    if (!form.name.trim()) local.name = "Enter a supplier name.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      local.email = "Enter a valid email address.";
    setErrors(local);
    if (Object.keys(local).length) return;

    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      note: form.note.trim() || null,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await SupplierService.update(supplier.id, payload);
        onSaved("updated");
      } else {
        await SupplierService.create(payload);
        onSaved("created");
      }
      close();
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      setFormError(
        Object.keys(parsed.fields).length
          ? "Fix the highlighted fields and save again."
          : parsed.message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={saving ? undefined : close}
        className={`absolute inset-0 bg-[#0f1a33]/45 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <form
        onSubmit={submit}
        className={`relative flex h-full w-full max-w-xl transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1957d6] to-[#2f80ff] px-8 py-5 text-white">
          <h2 id="drawer-title" className="text-lg font-bold">
            {isEdit ? "Edit supplier" : "Add supplier"}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            aria-label="Close"
            className={`rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-7">
          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-[#ffd0d0] bg-[#ffe9ec] px-3 py-2.5 text-sm text-[#c54646]"
            >
              {formError}
            </p>
          )}

          <Field label="Supplier name" error={errors.name}>
            <input
              value={form.name}
              onChange={setText("name")}
              placeholder="e.g. Fresh Foods Co."
              className={inputCls}
              autoFocus
            />
          </Field>

          <Field label="Contact person" error={errors.contact_person}>
            <input
              value={form.contact_person}
              onChange={setText("contact_person")}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone}>
              <input
                value={form.phone}
                onChange={setText("phone")}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={setText("email")}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Address" error={errors.address}>
            <textarea
              value={form.address}
              onChange={setText("address")}
              rows={3}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <Field label="Note" error={errors.note}>
            <textarea
              value={form.note}
              onChange={setText("note")}
              rows={3}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <label className="flex items-center gap-3 text-sm text-[#3d4a63]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className={checkboxCls}
            />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#f0f3f9] px-8 py-4">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className={`min-w-28 rounded-lg border border-[#dfe6f2] px-4 py-2.5 text-sm font-medium text-[#3d4a63] hover:bg-[#f4f7fc] disabled:opacity-50 ${focusRing}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`min-w-36 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d5fe0] disabled:opacity-60 ${focusRing}`}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
