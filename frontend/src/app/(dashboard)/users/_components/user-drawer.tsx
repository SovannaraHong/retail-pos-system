"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { UserService } from "@/services/user-service";
import type {
  Role,
  StoreUserPayload,
  UpdateUserPayload,
  User,
} from "@/types/user";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
import { UserAvatar } from "./user-avatar";

const DURATION = 300; // ms, keep in sync with duration-300 below
const MIN_PASSWORD = 8; // the server has the final say
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // backend: max:2048 (KB)
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  user: User | null; // null = create
  roles: Role[];
  /** Called after the closing animation finished: unmount the drawer here. */
  onClose: () => void;
  /** Called right after a successful save (the drawer then closes itself). */
  onSaved: (mode: "created" | "updated") => void;
}

interface FormState {
  name: string;
  email: string;
  employee_code: string;
  phone: string;
  password: string;
  pin: string;
  is_active: boolean;
}

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2.5 text-sm text-[#1c2740] placeholder:text-[#9aa5b8] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const checkboxCls =
  "h-4 w-4 rounded border-[#c5cddb] text-[#2f6fe8] focus:ring-[#2f6fe8]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-[#3d4a63]">
      {label}
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs font-normal text-[#9aa5b8]">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-normal text-[#e5484d]">
          {error}
        </span>
      )}
    </label>
  );
}

export function UserDrawer({ user, roles, onClose, onSaved }: Props) {
  const isEdit = user !== null;
  const { open, close } = useOverlayTransition(onClose, DURATION);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusTrap(formRef);

  const [form, setForm] = useState<FormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    employee_code: user?.employee_code ?? "",
    phone: user?.phone ?? "",
    password: "",
    pin: "",
    is_active: user?.is_active ?? true,
  });

  // The API sends role NAMES, the form needs a role id. null = not touched yet,
  // so the roles can finish loading after the drawer opened.
  const initialRoleId = user
    ? String(roles.find((r) => user.role.includes(r.name))?.id ?? "")
    : "";
  const [roleChoice, setRoleChoice] = useState<string | null>(null);
  const roleId = roleChoice ?? initialRoleId;

  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

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

  const setText =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password; // never trim a password
    const pin = form.pin.trim();

    const local: Record<string, string> = {};
    if (!name) local.name = "Enter a name.";
    if (!email) local.email = "Enter an email.";
    else if (!EMAIL_RE.test(email)) local.email = "Enter a valid email.";
    if (!isEdit && !password) local.password = "Enter a password.";
    else if (password && password.length < MIN_PASSWORD)
      local.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (pin && !/^\d{4,6}$/.test(pin))
      local.pin = "The PIN must be 4 to 6 digits.";

    setErrors(local);
    if (Object.keys(local).length) return;

    const shared = {
      name,
      email,
      employee_code: form.employee_code.trim() || null,
      phone: form.phone.trim() || null,
      is_active: form.is_active,
      role_id: roleId ? Number(roleId) : undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        const payload: UpdateUserPayload = {
          ...shared,
          // null clears the role; undefined keeps it
          role_id: roleId ? Number(roleId) : initialRoleId ? null : undefined,
          password: password || undefined, // blank = keep the current one
          pin: pin || undefined,
          image: file ?? undefined,
          remove_image: removeImage && !file ? true : undefined,
        };
        await UserService.update(user.id, payload);
        onSaved("updated");
      } else {
        const payload: StoreUserPayload = {
          ...shared,
          password,
          pin: pin || null,
          image: file ?? undefined,
        };
        await UserService.create(payload);
        onSaved("created");
      }
      close(); // slide out, then the parent unmounts us
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

  const currentImage =
    preview ?? (removeImage ? null : (user?.image_url ?? null));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-drawer-title"
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
        className={`relative flex h-full w-full max-w-2xl transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1957d6] to-[#2f80ff] px-8 py-5 text-white">
          <h2 id="user-drawer-title" className="text-lg font-bold">
            {isEdit ? "Edit user" : "Add user"}
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

          {/* photo */}
          <div className="flex items-center gap-5 rounded-2xl bg-[#f4f7fc] p-5">
            {currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt=""
                className="h-20 w-20 rounded-full bg-white object-cover"
              />
            ) : (
              <UserAvatar
                user={{ name: form.name || "New user", image_url: null }}
                className="h-20 w-20 text-lg"
              />
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`inline-flex items-center gap-2 rounded-lg border border-[#dfe6f2] bg-white px-3 py-2 text-sm font-medium text-[#3d4a63] hover:bg-[#f1f5fd] ${focusRing}`}
                >
                  <ImagePlus className="h-4 w-4 text-[#2f6fe8]" />
                  {currentImage ? "Change photo" : "Upload photo"}
                </button>
                {currentImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRemoveImage(true);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium text-[#e5484d] hover:bg-[#ffe9ec] ${focusRing}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-[#9aa5b8]">
                JPG, PNG or WEBP, up to 2 MB. Square works best.
              </p>
              {errors.image && (
                <p className="text-xs text-[#e5484d]">{errors.image}</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  const problem = !f
                    ? null
                    : !IMAGE_TYPES.includes(f.type)
                      ? "Use a JPG, PNG or WEBP image."
                      : f.size > MAX_IMAGE_BYTES
                        ? "The image must be 2 MB or smaller."
                        : null;
                  if (problem) {
                    setErrors((er) => ({ ...er, image: problem }));
                    e.target.value = "";
                    return;
                  }
                  setErrors((er) => {
                    const next = { ...er };
                    delete next.image;
                    return next;
                  });
                  setFile(f);
                  if (f) setRemoveImage(false);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              <input
                value={form.name}
                onChange={setText("name")}
                placeholder="e.g. Sok Dara"
                maxLength={255}
                className={inputCls}
                autoFocus
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={setText("email")}
                placeholder="name@company.com"
                autoComplete="off"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Employee code" error={errors.employee_code}>
              <input
                value={form.employee_code}
                onChange={setText("employee_code")}
                placeholder="EMP001"
                maxLength={50}
                className={inputCls}
              />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={setText("phone")}
                placeholder="012 345 678"
                maxLength={30}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label={isEdit ? "New password" : "Password"}
              error={errors.password}
              hint={
                isEdit
                  ? "Leave blank to keep the current password."
                  : `At least ${MIN_PASSWORD} characters.`
              }
            >
              <input
                type="password"
                value={form.password}
                onChange={setText("password")}
                autoComplete="new-password"
                className={inputCls}
              />
            </Field>
            <Field
              label={isEdit ? "New PIN" : "PIN"}
              error={errors.pin}
              hint={
                isEdit
                  ? "Leave blank to keep the current PIN."
                  : "Optional, 4 to 6 digits."
              }
            >
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={form.pin}
                onChange={setText("pin")}
                autoComplete="new-password"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Role" error={errors.role_id}>
            <select
              value={roleId}
              onChange={(e) => setRoleChoice(e.target.value)}
              className={inputCls}
            >
              <option value="">No role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
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
            Active — can sign in
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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add user"}
          </button>
        </div>
      </form>
    </div>
  );
}
