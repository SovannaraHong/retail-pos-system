"use client";

import { useEffect, useRef } from "react";
import type { Permission } from "@/types/role";
import { actionOf, groupPermissions, titleCase } from "./permission-groups";

interface Props {
  permissions: Permission[];
  value: Set<number>;
  onChange: (next: Set<number>) => void;
}

const checkboxCls =
  "h-4 w-4 cursor-pointer rounded border-[#c5cddb] text-[#2f6fe8] focus:ring-[#2f6fe8]";

function GroupCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
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
      aria-label={label}
      className={checkboxCls}
    />
  );
}

export function PermissionPicker({ permissions, value, onChange }: Props) {
  const groups = groupPermissions(permissions);
  const allChecked =
    permissions.length > 0 && permissions.every((p) => value.has(p.id));

  const toggleOne = (id: number) => {
    const n = new Set(value);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange(n);
  };

  const toggleGroup = (items: Permission[]) => {
    const n = new Set(value);
    const all = items.every((p) => n.has(p.id));
    items.forEach((p) => (all ? n.delete(p.id) : n.add(p.id)));
    onChange(n);
  };

  const toggleAll = () =>
    onChange(allChecked ? new Set() : new Set(permissions.map((p) => p.id)));

  if (permissions.length === 0) {
    return (
      <p className="rounded-xl bg-[#f4f7fc] px-4 py-6 text-center text-sm text-[#7d8aa1]">
        No permissions available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#3d4a63]">
          Permissions{" "}
          <span className="font-normal text-[#9aa5b8]">
            ({value.size}/{permissions.length})
          </span>
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="rounded px-1 text-xs font-semibold text-[#1d5fe0] hover:underline focus-visible:outline-2 focus-visible:outline-[#2f6fe8]"
        >
          {allChecked ? "Clear all" : "Select all"}
        </button>
      </div>

      {groups.map((g) => {
        const selectedCount = g.items.filter((p) => value.has(p.id)).length;
        const all = selectedCount === g.items.length;
        return (
          <div key={g.key} className="rounded-xl border border-[#e9eef7]">
            <label className="flex cursor-pointer items-center gap-3 rounded-t-xl bg-[#f4f7fc] px-4 py-2.5 text-sm font-semibold text-[#1c2740]">
              <GroupCheckbox
                checked={all}
                indeterminate={selectedCount > 0 && !all}
                onChange={() => toggleGroup(g.items)}
                label={`Select all ${g.key} permissions`}
              />
              {titleCase(g.key)}
              <span className="ml-auto text-xs font-normal text-[#9aa5b8]">
                {selectedCount}/{g.items.length}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-3">
              {g.items.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[#3d4a63]"
                >
                  <input
                    type="checkbox"
                    checked={value.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className={checkboxCls}
                  />
                  {titleCase(actionOf(p.name))}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
