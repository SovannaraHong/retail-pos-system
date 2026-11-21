"use client";

import { useEffect, useRef } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { User } from "@/types/user";
import { focusRing } from "@/libs/format";
import { UserAvatar } from "./user-avatar";

interface Props {
  users: User[];
  selected: Set<number>;
  busy?: boolean; // refetching: keep rows visible but dim them
  trashed: boolean; // showing the "Deleted" tab: rows can be restored, not edited
  canEdit: boolean;
  canDelete: boolean; // also covers restore
  onToggle: (id: number) => void;
  onTogglePage: () => void;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  onRestore: (u: User) => void;
}

const checkbox =
  "h-4 w-4 rounded border-[#c5cddb] cursor-pointer text-[#2f6fe8] focus:ring-[#2f6fe8]";

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
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
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
      onChange={onChange}
      aria-label="Select all on this page"
      className={checkbox}
    />
  );
}

export function UserTable({
  users,
  selected,
  busy,
  trashed,
  canEdit,
  canDelete,
  onToggle,
  onTogglePage,
  onEdit,
  onDelete,
  onRestore,
}: Props) {
  const selectedOnPage = users.filter((u) => selected.has(u.id)).length;
  const allSelected = users.length > 0 && selectedOnPage === users.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const showSelect = canDelete;
  const showActions = trashed ? canDelete : canEdit || canDelete;

  return (
    <div
      className={`overflow-x-auto transition-opacity ${busy ? "opacity-60" : ""}`}
      aria-busy={busy}
    >
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-[#f4f7fc] text-xs text-[#5d6b85]">
          <tr>
            {showSelect && (
              <th className="w-12 py-3 pl-5">
                <SelectAll
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onTogglePage}
                />
              </th>
            )}
            <th className={`py-3 pr-4 font-medium ${showSelect ? "" : "pl-5"}`}>
              User
            </th>
            <th className="py-3 pr-4 font-medium">Employee code</th>
            <th className="py-3 pr-4 font-medium">Phone</th>
            <th className="py-3 pr-4 font-medium">Role</th>
            <th className="py-3 pr-4 font-medium">
              {trashed ? "Deleted on" : "Status"}
            </th>
            {showActions && (
              <th className="py-3 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f3f9]">
          {users.map((u) => {
            const isSel = selected.has(u.id);
            return (
              <tr
                key={u.id}
                className={`transition-colors hover:bg-[#f8faff] ${isSel ? "bg-[#eef4ff]" : ""}`}
              >
                {showSelect && (
                  <td className="py-3 pl-5">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => onToggle(u.id)}
                      aria-label={`Select ${u.name}`}
                      className={checkbox}
                    />
                  </td>
                )}
                <td className={`py-3 pr-4 ${showSelect ? "" : "pl-5"}`}>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#1c2740]">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-[#7d8aa1]">
                        {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-[#3d4a63]">
                  {u.employee_code || "—"}
                </td>
                <td className="py-3 pr-4 text-[#3d4a63]">{u.phone || "—"}</td>
                <td className="py-3 pr-4">
                  {u.role.length ? (
                    <div className="flex flex-wrap gap-1">
                      {u.role.map((r) => (
                        <span
                          key={r}
                          className="rounded-full bg-[#e8f0ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d5fe0]"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#9aa5b8]">No role</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {trashed ? (
                    <span className="text-[#7d8aa1]">
                      {formatDate(u.deleted_at)}
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        u.is_active
                          ? "bg-[#e3f7ec] text-[#1f9d55]"
                          : "bg-[#eef1f7] text-[#5d6b85]"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </td>
                {showActions && (
                  <td className="py-3 pr-5">
                    <div className="flex justify-end gap-0.5">
                      {trashed ? (
                        <IconButton
                          label={`Restore ${u.name}`}
                          onClick={() => onRestore(u)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </IconButton>
                      ) : (
                        <>
                          {canEdit && (
                            <IconButton
                              label={`Edit ${u.name}`}
                              onClick={() => onEdit(u)}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              label={`Delete ${u.name}`}
                              danger
                              onClick={() => onDelete(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          )}
                        </>
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
