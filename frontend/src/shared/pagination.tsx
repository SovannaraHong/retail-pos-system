import { ChevronLeft, ChevronRight } from "lucide-react";
import { focusRing } from "@/libs/format";

interface Props {
  page: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number | null;
  to: number | null;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
}

export function Pagination({
  page,
  lastPage,
  perPage,
  total,
  from,
  to,
  onPage,
  onPerPage,
}: Props) {
  if (total === 0) return null;

  const max = 5;
  const end = Math.min(lastPage, Math.max(1, page - 2) + max - 1);
  const begin = Math.max(1, end - max + 1);
  const numbers = Array.from({ length: end - begin + 1 }, (_, i) => begin + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f3f9] px-5 py-3.5 text-xs text-[#6c7a93]">
      <div className="flex items-center gap-3">
        <span>
          Showing {from ?? 0}–{to ?? 0} of {total}
        </span>
        <select
          value={perPage}
          onChange={(e) => onPerPage(Number(e.target.value))}
          aria-label="Rows per page"
          className="rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-2 py-1.5 text-xs text-[#3d4a63] outline-none focus:border-[#2f6fe8]"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`rounded-lg p-2 text-[#3d4a63] hover:bg-[#f1f5fd] disabled:opacity-30 disabled:hover:bg-transparent ${focusRing}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${focusRing} ${
              n === page
                ? "bg-[#2f6fe8] text-white shadow-sm"
                : "text-[#3d4a63] hover:bg-[#f1f5fd]"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= lastPage}
          aria-label="Next page"
          className={`rounded-lg p-2 text-[#3d4a63] hover:bg-[#f1f5fd] disabled:opacity-30 disabled:hover:bg-transparent ${focusRing}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
