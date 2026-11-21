"use client";

import { Lock, Pencil, ShieldCheck, Trash2, Users } from "lucide-react";
import type { Role } from "@/types/role";
import { focusRing } from "@/libs/format";

const PROTECTED_ROLES = ["admin"];

interface Props {
  roles: Role[];
  busy?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (r: Role) => void;
  onEdit: (r: Role) => void;
  onDelete: (r: Role) => void;
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

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function RoleTable({
  roles,
  busy,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const showActions = canEdit || canDelete;

  return (
    <div
      className={`overflow-x-auto transition-opacity ${busy ? "opacity-60" : ""}`}
      aria-busy={busy}
    >
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[#f4f7fc] text-xs text-[#5d6b85]">
          <tr>
            <th className="py-3 pl-5 pr-4 font-medium">Role</th>
            <th className="py-3 pr-4 font-medium">Permissions</th>
            <th className="py-3 pr-4 font-medium">Users</th>
            <th className="py-3 pr-4 font-medium">Created</th>
            {showActions && (
              <th className="py-3 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f3f9]">
          {roles.map((r) => {
            const isProtected = PROTECTED_ROLES.includes(r.name);
            const perms = r.permissions ?? [];
            return (
              <tr
                key={r.id}
                tabIndex={0}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button, a")) return;
                  onView(r);
                }}
                onKeyDown={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    onView(r);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-[#f8faff] focus-visible:bg-[#f1f5fd] focus-visible:outline-none"
              >
                <td className="py-3 pl-5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2f6fe8]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="flex items-center gap-2 font-semibold text-[#1c2740]">
                      <span className="truncate">{r.name}</span>
                      {isProtected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1f7] px-2 py-0.5 text-[10px] font-semibold text-[#5d6b85]">
                          <Lock className="h-3 w-3" />
                          System
                        </span>
                      )}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {perms.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full bg-[#f4f7fc] px-2 py-0.5 text-[11px] font-medium text-[#3d4a63]"
                      >
                        {p.name}
                      </span>
                    ))}
                    {perms.length > 3 && (
                      <span className="text-xs font-semibold text-[#7d8aa1]">
                        +{perms.length - 3} more
                      </span>
                    )}
                    {perms.length === 0 && (
                      <span className="text-[#9aa5b8]">—</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-[#3d4a63]">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Users className="h-4 w-4 text-[#9aa5b8]" />
                    {r.users_count ?? 0}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[#3d4a63]">
                  {formatDate(r.created_at)}
                </td>
                {showActions && (
                  <td className="py-3 pr-5">
                    <div className="flex justify-end gap-0.5">
                      {canEdit && (
                        <IconButton
                          label={`Edit ${r.name}`}
                          onClick={() => onEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canDelete && !isProtected && (
                        <IconButton
                          label={`Delete ${r.name}`}
                          danger
                          onClick={() => onDelete(r)}
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
