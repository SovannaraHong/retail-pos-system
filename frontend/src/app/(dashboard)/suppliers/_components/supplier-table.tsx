import { focusRing } from "@/libs/format";
import { Supplier } from "@/types/supplier";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  suppliers: Supplier[];
  selected: Set<number>;
  busy?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (s: Supplier) => void;
  onToggle: (id: number) => void;
  onTogglePage: () => void;
  onEdit: (s: Supplier) => void;
  onDelete: (s: Supplier) => void;
}
const checkbox =
  "h-4 w-4 rounded border-[#c5cddb] text-[#2f6fe8] focus:ring-[#2f6fe8]";

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
export function SupplierTable({
  suppliers,
  selected,
  busy,
  canEdit,
  canDelete,
  onView,
  onToggle,
  onTogglePage,
  onEdit,
  onDelete,
}: Props) {
  const allSelected =
    suppliers.length > 0 && suppliers.every((s) => selected.has(s.id));

  const showActions = canEdit || canDelete;

  return (
    <div
      className={`overflow-x-auto transition-opacity ${busy ? "opacity-60" : ""}`}
      aria-busy={busy}
    >
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[#f4f7fc] text-xs text-[#5d6b85]">
          <tr>
            <th className="w-12 py-3 pl-5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onTogglePage}
                aria-label="Select all on this page"
                className={checkbox}
              />
            </th>
            <th className="py-3 pr-4 font-medium">Supplier</th>
            <th className="py-3 pr-4 font-medium">Contact</th>
            <th className="py-3 pr-4 text-right font-medium">Products</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            {showActions && (
              <th className="py-3 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f3f9]">
          {suppliers.map((s) => {
            const isSel = selected.has(s.id);
            return (
              <tr
                key={s.id}
                tabIndex={0}
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).closest("input, button, a, label")
                  )
                    return;
                  onView(s);
                }}
                onKeyDown={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    onView(s);
                  }
                }}
                className={`cursor-pointer transition-colors hover:bg-[#f8faff] ${focusRing} ${isSel ? "bg-[#eef4ff]" : ""}`}
              >
                <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => onToggle(s.id)}
                    aria-label={`Select ${s.name}`}
                    className={checkbox}
                  />
                </td>
                <td className="py-3 pr-4">
                  <p className="font-semibold text-[#1c2740]">{s.name}</p>
                  {s.contact_person && (
                    <p className="truncate text-xs text-[#7d8aa1]">
                      {s.contact_person}
                    </p>
                  )}
                </td>
                <td className="py-3 pr-4 text-[#3d4a63]">
                  {s.phone || s.email ? (
                    <>
                      {s.phone && <p>{s.phone}</p>}
                      {s.email && (
                        <p className="truncate text-xs text-[#7d8aa1]">
                          {s.email}
                        </p>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-[#3d4a63]">
                  {s.products_count ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      s.is_active
                        ? "bg-[#e3f7ec] text-[#1f9d55]"
                        : "bg-[#eef1f7] text-[#5d6b85]"
                    }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {showActions && (
                  <td
                    className="py-3 pr-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-0.5">
                      {canEdit && (
                        <IconButton
                          label={`Edit ${s.name}`}
                          onClick={() => onEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          label={`Delete ${s.name}`}
                          danger
                          onClick={() => onDelete(s)}
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
