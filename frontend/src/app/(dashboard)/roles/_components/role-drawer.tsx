"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { RoleService } from "@/services/role-service";
import type { Permission, Role } from "@/types/role";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
import { PermissionPicker } from "./permission-picker";

const DURATION = 300; // keep in sync with duration-300 below
const PROTECTED_ROLES = ["admin"];

interface Props {
  role: Role | null; // null = create
  permissions: Permission[];
  onClose: () => void;
  onSaved: (mode: "created" | "updated") => void;
}

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2.5 text-sm text-[#1c2740] placeholder:text-[#9aa5b8] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20 disabled:bg-[#eef1f7] disabled:text-[#7d8aa1]";

export function RoleDrawer({ role, permissions, onClose, onSaved }: Props) {
  const isEdit = role !== null;
  const nameLocked = isEdit && PROTECTED_ROLES.includes(role.name);
  const { open, close } = useOverlayTransition(onClose, DURATION);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusTrap(formRef);

  const [name, setName] = useState(role?.name ?? "");
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(role?.permissions?.map((p) => p.id) ?? []),
  );
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
    if (!name.trim()) local.name = "Enter a role name.";
    else if (name.trim().length > 100)
      local.name = "Role name must be 100 characters or less.";
    setErrors(local);
    if (Object.keys(local).length) return;

    const payload = {
      ...(nameLocked ? {} : { name: name.trim() }),
      permissions: Array.from(selected),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await RoleService.update(role.id, payload);
        onSaved("updated");
      } else {
        await RoleService.create(payload);
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
      aria-labelledby="role-drawer-title"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={saving ? undefined : close}
        className={`absolute inset-0 bg-[#0f1a33]/45 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className={`relative flex h-full w-full max-w-2xl transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1957d6] to-[#2f80ff] px-8 py-5 text-white">
          <h2 id="role-drawer-title" className="text-lg font-bold">
            {isEdit ? "Edit role" : "Add role"}
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
            Role name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cashier"
              disabled={nameLocked}
              className={inputCls}
              autoFocus
            />
            {nameLocked && (
              <span className="mt-1 block text-xs font-normal text-[#9aa5b8]">
                This role cannot be renamed.
              </span>
            )}
            {errors.name && (
              <span className="mt-1 block text-xs font-normal text-[#e5484d]">
                {errors.name}
              </span>
            )}
          </label>

          <div>
            <PermissionPicker
              permissions={permissions}
              value={selected}
              onChange={setSelected}
            />
            {errors.permissions && (
              <p className="mt-2 text-xs text-[#e5484d]">
                {errors.permissions}
              </p>
            )}
          </div>
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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add role"}
          </button>
        </div>
      </form>
    </div>
  );
}
