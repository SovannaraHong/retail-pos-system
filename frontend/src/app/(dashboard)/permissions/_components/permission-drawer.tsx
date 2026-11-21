"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { PermissionService } from "@/services/permission-service";
import {
  PERMISSION_NAME_RE,
  splitPermission,
  type Permission,
} from "@/types/permission";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";

const DURATION = 300; // ms, keep in sync with duration-300 below

interface Props {
  permission: Permission | null; // null = create
  /** Called after the closing animation finished: unmount the drawer here. */
  onClose: () => void;
  /** Called right after a successful save (the drawer then closes itself). */
  onSaved: (mode: "created" | "updated") => void;
}

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2.5 font-mono text-sm text-[#1c2740] placeholder:font-sans placeholder:text-[#9aa5b8] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

export function PermissionDrawer({ permission, onClose, onSaved }: Props) {
  const isEdit = permission !== null;
  const { open, close } = useOverlayTransition(onClose, DURATION);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusTrap(formRef);

  const [name, setName] = useState(permission?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Esc closes (with animation), unless a save is running
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, saving]);

  // lock the page behind the drawer from scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const clean = name.trim().toLowerCase();
  const { resource, action } = splitPermission(clean);
  const looksValid = PERMISSION_NAME_RE.test(clean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!clean) return setError("Enter a permission name.");
    if (!looksValid)
      return setError("Use the format resource.action, e.g. products.view.");
    setError(null);

    setSaving(true);
    try {
      if (isEdit) {
        await PermissionService.update(permission.id, { name: clean });
        onSaved("updated");
      } else {
        await PermissionService.create({ name: clean });
        onSaved("created");
      }
      close(); // slide out, then the parent unmounts us
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.fields.name) setError(parsed.fields.name);
      setFormError(
        Object.keys(parsed.fields).length
          ? "Fix the highlighted field and save again."
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
      aria-labelledby="permission-drawer-title"
    >
      {/* backdrop fades in / out (not a tab stop: Esc and the X button close) */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={saving ? undefined : close}
        className={`absolute inset-0 bg-[#0f1a33]/45 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* panel slides in from the right */}
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className={`relative flex h-full w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1957d6] to-[#2f80ff] px-8 py-5 text-white">
          <h2 id="permission-drawer-title" className="text-lg font-bold">
            {isEdit ? "Edit permission" : "Add permission"}
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
            Permission name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="products.view"
              className={inputCls}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {error ? (
              <span className="mt-1 block text-xs font-normal text-[#e5484d]">
                {error}
              </span>
            ) : (
              <span className="mt-1 block text-xs font-normal text-[#9aa5b8]">
                Format: resource.action. Lowercase letters, numbers and
                underscores only.
              </span>
            )}
          </label>

          {/* live preview of how the name will be read */}
          {clean && (
            <div className="rounded-2xl bg-[#f4f7fc] p-5 text-sm">
              <p className="text-xs font-semibold text-[#5d6b85]">Preview</p>
              {looksValid ? (
                <dl className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-[#7d8aa1]">
                      Resource
                    </dt>
                    <dd className="mt-0.5 font-semibold text-[#1c2740]">
                      {resource}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#7d8aa1]">
                      Action
                    </dt>
                    <dd className="mt-0.5 font-semibold text-[#1c2740]">
                      {action}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-[#7d8aa1]">
                  Not a valid name yet: it needs one dot between resource and
                  action.
                </p>
              )}
            </div>
          )}

          {isEdit && (
            <p className="rounded-lg bg-[#fff4db] px-3 py-2.5 text-xs text-[#8a5a12]">
              Renaming is only allowed while no role or user has this
              permission, because code checks it by name.
            </p>
          )}
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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add permission"}
          </button>
        </div>
      </form>
    </div>
  );
}
