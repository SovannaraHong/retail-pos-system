"use client";

import { useState } from "react";

import Segmented from "@/components/dashboard/segmented";
import { iso, presetRange, validateRange } from "@/libs/date-range";
import { RANGES, type PickedRange, type RangeKey } from "@/types/report";

const OPTIONS: { key: RangeKey; label: string }[] = [
  ...RANGES,
  { key: "custom", label: "Custom" },
];

const input =
  "rounded-lg border border-[#e1e8f4] bg-white px-2.5 py-1.5 text-xs text-[#1c2740] outline-none focus:border-[#2f6fe8]";

export default function DateRangePicker({
  value,
  onChange,
}: {
  value: PickedRange;
  onChange: (v: PickedRange) => void;
}) {
  const [draft, setDraft] = useState({ from: value.from, to: value.to });
  const [seen, setSeen] = useState(`${value.from}:${value.to}`);

  // when a preset (or the URL) changes the range, reset the inputs.
  // Done during render instead of in an effect, so there is no extra render pass.
  const signature = `${value.from}:${value.to}`;
  if (signature !== seen) {
    setSeen(signature);
    setDraft({ from: value.from, to: value.to });
  }

  const error = validateRange(draft);
  const today = iso(new Date());

  const edit = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (!validateRange(next)) onChange({ key: "custom", ...next });
  };

  const pick = (key: RangeKey) => {
    if (key === "custom") onChange({ key, ...draft });
    else onChange({ key, ...presetRange(key) });
  };

  return (
    <div className="flex flex-col gap-2 lg:items-end">
      <div className="max-w-full overflow-x-auto">
        <Segmented options={OPTIONS} value={value.key} onChange={pick} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5d6b85]">
        <label className="flex items-center gap-1.5">
          From
          <input
            type="date"
            className={input}
            value={draft.from}
            max={draft.to || today}
            onChange={(e) => edit({ from: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-1.5">
          To
          <input
            type="date"
            className={input}
            value={draft.to}
            min={draft.from}
            max={today}
            onChange={(e) => edit({ to: e.target.value })}
          />
        </label>
        {error && <span className="font-medium text-[#d64545]">{error}</span>}
      </div>
    </div>
  );
}
