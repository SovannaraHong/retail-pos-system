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
    <div className="inline-flex rounded-xl bg-[#f4f7fc] p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-lg font-semibold transition ${focusRing} ${
            small ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
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
