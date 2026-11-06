import {
  RANGES,
  type DateRange,
  type PickedRange,
  type PresetKey,
} from "@/types/report";

export const MAX_DAYS = 366; // same limit as ReportService::range()

export const iso = (d: Date) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD (local)

export const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isIso = (s?: string | null): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseIso(s).getTime());

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

export const daysIn = (r: DateRange) =>
  Math.round(
    (parseIso(r.to).getTime() - parseIso(r.from).getTime()) / 86_400_000,
  ) + 1;

export function presetRange(key: PresetKey): DateRange {
  const t = new Date();
  const y = t.getFullYear();
  const m = t.getMonth();

  switch (key) {
    case "today":
      return { from: iso(t), to: iso(t) };
    case "yesterday": {
      const d = addDays(t, -1);
      return { from: iso(d), to: iso(d) };
    }
    case "7d":
      return { from: iso(addDays(t, -6)), to: iso(t) };
    case "30d":
      return { from: iso(addDays(t, -29)), to: iso(t) };
    case "month":
      return { from: iso(new Date(y, m, 1)), to: iso(t) };
    case "last_month":
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case "quarter":
      return { from: iso(new Date(y, Math.floor(m / 3) * 3, 1)), to: iso(t) };
    case "year":
      return { from: iso(new Date(y, 0, 1)), to: iso(t) };
  }
}

/** The period of the same length directly before `r`. */
export function previousRange(r: DateRange): DateRange {
  const days = daysIn(r);
  const prevTo = addDays(parseIso(r.from), -1);
  return { from: iso(addDays(prevTo, -(days - 1))), to: iso(prevTo) };
}

/** A chart needs more than one point, so a single day shows the last 7 days. */
export function chartRange(r: DateRange): DateRange {
  return daysIn(r) < 2
    ? { from: iso(addDays(parseIso(r.to), -6)), to: r.to }
    : r;
}

export function validateRange(r: DateRange): string | null {
  if (!isIso(r.from) || !isIso(r.to)) return "Pick both dates.";
  if (r.from > r.to) return "“From” must be on or before “To”.";
  if (daysIn(r) > MAX_DAYS) return `Pick at most ${MAX_DAYS} days.`;
  return null;
}

export const DEFAULT_RANGE: PickedRange = { key: "7d", ...presetRange("7d") };

/** Read the range from the URL: ?range=7d  or  ?from=2026-10-01&to=2026-11-05 */
export function readRange(sp: {
  get(name: string): string | null;
}): PickedRange {
  const key = sp.get("range");
  const preset = RANGES.find((r) => r.key === key);
  if (preset) return { key: preset.key, ...presetRange(preset.key) };

  const from = sp.get("from");
  const to = sp.get("to");
  if (isIso(from) && isIso(to) && !validateRange({ from, to }))
    return { key: "custom", from, to };

  return DEFAULT_RANGE;
}

export function toSearch(r: PickedRange): string {
  const sp = new URLSearchParams();
  if (r.key === "custom") {
    sp.set("from", r.from);
    sp.set("to", r.to);
  } else {
    sp.set("range", r.key);
  }
  return sp.toString();
}
