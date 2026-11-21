"use client";

import { useEffect, useRef } from "react";
import { Pencil, ShieldCheck, X } from "lucide-react";
import type { Role } from "@/types/role";
import { focusRing } from "@/libs/format";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { actionOf, groupPermissions, titleCase } from "./permission-groups";

interface Props {
  role: Role;
  canEdit: boolean;
  onEdit: (r: Role) => void;
  onClose: () => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function RoleDetailModal({ role: r, canEdit, onEdit, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const groups = groupPermissions(r.permissions ?? []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${r.name} details`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="flex items-start gap-4 border-b border-[#f0f3f9] p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2f6fe8]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-extrabold text-[#1c2740]">
              {r.name}
            </h3>
            <p className="text-sm text-[#7d8aa1]">
              {r.users_count ?? 0} {r.users_count === 1 ? "user" : "users"} ·{" "}
              {r.permissions?.length ?? 0} permissions
            </p>
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
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9aa5b8]">
              Permissions
            </h4>
            {groups.length === 0 ? (
              <p className="text-sm text-[#7d8aa1]">No permissions assigned.</p>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => (
                  <div key={g.key}>
                    <p className="mb-1.5 text-sm font-semibold text-[#1c2740]">
                      {titleCase(g.key)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full bg-[#e8f0ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d5fe0]"
                        >
                          {titleCase(actionOf(p.name))}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <dl className="grid grid-cols-2 gap-4 border-t border-[#f0f3f9] pt-4">
              {[
                ["Created", formatDate(r.created_at)],
                ["Last updated", formatDate(r.updated_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-[#7d8aa1]">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-[#1c2740]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
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
              onClick={() => onEdit(r)}
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
