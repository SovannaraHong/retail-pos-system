"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Brand } from "@/types/brand";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
import { BrandService } from "@/services/brand-service";

const DURATION = 300;

interface Props {
  brand: Brand | null; // null = create
  onClose: () => void;
  onSaved: (mode: "created" | "updated") => void;
}

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2.5 text-sm text-[#1c2740] placeholder:text-[#9aa5b8] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const checkboxCls =
  "h-4 w-4 rounded border-[#c5cddb] text-[#2f6fe8] focus:ring-[#2f6fe8]";

export function BrandDrawer({ brand, onClose, onSaved }: Props) {
  const isEdit = brand !== null;
  const { open, close } = useOverlayTransition(onClose, DURATION);

  const [form, setForm] = useState({
    name: brand?.name ?? "",
    is_active: brand?.is_active ?? true,
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const local: Record<string, string> = {};
    if (!form.name.trim()) local.name = "Enter a brand name.";
    setErrors(local);
    if (Object.keys(local).length) return;

    const payload = { name: form.name.trim(), is_active: form.is_active };

    setSaving(true);
    try {
      if (isEdit) {
        await BrandService.update(brand.id, payload);
        onSaved("updated");
      } else {
        await BrandService.create(payload);
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
        className={`relative flex h-full w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1957d6] to-[#2f80ff] px-8 py-5 text-white">
          <h2 id="drawer-title" className="text-lg font-bold">
            {isEdit ? "Edit brand" : "Add brand"}
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

          <label className="block text-xs font-semibold text-[#3d4a63]">
            Brand name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nestlé"
              className={inputCls}
              autoFocus
            />
            {errors.name && (
              <span className="mt-1 block text-xs font-normal text-[#e5484d]">
                {errors.name}
              </span>
            )}
          </label>

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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add brand"}
          </button>
        </div>
      </form>
    </div>
  );
}
