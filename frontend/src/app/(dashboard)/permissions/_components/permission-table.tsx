"use client";

import { useEffect, useRef } from "react";
import { Lock, Pencil, Trash2 } from "lucide-react";
import {
  isProtectedPermission,
  splitPermission,
  type Permission,
} from "@/types/permission";
import { focusRing } from "@/libs/format";

interface Props {
  permissions: Permission[];
  selected: Set<number>;
  busy?: boolean; // refetching: keep rows visible but dim them
  canEdit: boolean;
  canDelete: boolean;
  onToggle: (id: number) => void;
  onTogglePage: () => void;
  onEdit: (p: Permission) => void;
  onDelete: (p: Permission) => void;
}

const checkbox =
  "h-4 w-4 rounded border-[#c5cddb] cursor-pointer text-[#2f6fe8] focus:ring-[#2f6fe8] disabled:cursor-not-allowed disabled:opacity-40";

const ACTION_STYLES: Record<string, string> = {
  view: "bg-[#e8f0ff] text-[#1d5fe0]",
  create: "bg-[#e3f7ec] text-[#1f9d55]",
  update: "bg-[#fff4db] text-[#b7791f]",
  delete: "bg-[#ffe9ec] text-[#e5484d]",
};
const ACTION_FALLBACK = "bg-[#eef1f7] text-[#5d6b85]";

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 text-[#7d8aa1] transition-colors ${focusRing} ${
        danger
          ? "hover:bg-[#ffe9ec] hover:text-[#e5484d]"
          : "hover:bg-[#e8f0ff] hover:text-[#2f6fe8]"
      }`}
    >
      {children}
    </button>
  );
}

/** "Select all" checkbox with a real indeterminate (dash) state. */
function SelectAll({
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label="Select all on this page"
      className={checkbox}
    />
  );
}

export function PermissionTable({
  permissions,
  selected,
  busy,
  canEdit,
  canDelete,
  onToggle,
  onTogglePage,
  onEdit,
  onDelete,
}: Props) {
  // protected rows can't be changed, so they can't be selected either
  const selectable = permissions.filter((p) => !isProtectedPermission(p));
  const selectedOnPage = selectable.filter((p) => selected.has(p.id)).length;
  const allSelected =
    selectable.length > 0 && selectedOnPage === selectable.length;
  const someSelected = selectedOnPage > 0 && !allSelected;
  const showActions = canEdit || canDelete;
  const showSelect = canDelete;

  return (
    <div
      className={`overflow-x-auto transition-opacity ${busy ? "opacity-60" : ""}`}
      aria-busy={busy}
    >
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#f4f7fc] text-xs text-[#5d6b85]">
          <tr>
            {showSelect && (
              <th className="w-12 py-3 pl-5">
                <SelectAll
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={selectable.length === 0}
                  onChange={onTogglePage}
                />
              </th>
            )}
            <th className={`py-3 pr-4 font-medium ${showSelect ? "" : "pl-5"}`}>
              Permission
            </th>
            <th className="py-3 pr-4 font-medium">Resource</th>
            <th className="py-3 pr-4 font-medium">Action</th>
            <th className="py-3 pr-4 font-medium">Guard</th>
            <th className="py-3 pr-4 font-medium">Created</th>
            {showActions && (
              <th className="py-3 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f3f9]">
          {permissions.map((p) => {
            const isSel = selected.has(p.id);
            const locked = isProtectedPermission(p);
            const { resource, action } = splitPermission(p.name);

            return (
              <tr
                key={p.id}
                className={`transition-colors hover:bg-[#f8faff] ${isSel ? "bg-[#eef4ff]" : ""}`}
              >
                {showSelect && (
                  <td className="py-3 pl-5">
                    <input
                      type="checkbox"
                      checked={isSel}
                      disabled={locked}
                      onChange={() => onToggle(p.id)}
                      aria-label={`Select ${p.name}`}
                      className={checkbox}
                    />
                  </td>
                )}
                <td className={`py-3 pr-4 ${showSelect ? "" : "pl-5"}`}>
                  <p className="flex items-center gap-2 font-mono text-[13px] font-semibold text-[#1c2740]">
                    <span className="truncate">{p.name}</span>
                    {locked && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-[#eef1f7] px-2 py-0.5 font-sans text-[10px] font-semibold text-[#5d6b85]"
                        title="Manages access control: cannot be renamed or deleted"
                      >
                        <Lock className="h-3 w-3" />
                        System
                      </span>
                    )}
                  </p>
                </td>
                <td className="py-3 pr-4 text-[#3d4a63]">{resource || "—"}</td>
                <td className="py-3 pr-4">
                  {action ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        ACTION_STYLES[action] ?? ACTION_FALLBACK
                      }`}
                    >
                      {action}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-[#7d8aa1]">{p.guard_name}</td>
                <td className="py-3 pr-4 text-[#7d8aa1]">
                  {formatDate(p.created_at)}
                </td>
                {showActions && (
                  <td className="py-3 pr-5">
                    <div className="flex justify-end gap-0.5">
                      {canEdit && !locked && (
                        <IconButton
                          label={`Edit ${p.name}`}
                          onClick={() => onEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canDelete && !locked && (
                        <IconButton
                          label={`Delete ${p.name}`}
                          danger
                          onClick={() => onDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
