"use client";

import { focusRing } from "@/libs/format";

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div className="inline-flex max-w-full items-center overflow-x-auto rounded-xl bg-[#f4f7fc] p-1 scrollbar-none">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`shrink-0 whitespace-nowrap rounded-lg font-semibold transition ${focusRing} ${
            small ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs sm:px-3.5"
          } ${
            value === o.key
              ? "bg-white text-[#1d5fe0] shadow-sm"
              : "text-[#5d6b85] hover:text-[#1c2740]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
