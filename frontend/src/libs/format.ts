// Laravel decimals often arrive as strings ("99.99"), so always go through Number()
export const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value ?? 0),
  );

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1";

/* ---- added for the dashboard ---- */

// 12800 -> "12.8K" (used in the donut centre)
export const compact = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

// % change between two periods, for the stat-card notes
export function delta(current: number, previous: number) {
  if (!previous)
    return { text: current ? "New activity" : "No change", up: true };
  const pct = ((current - previous) / previous) * 100;
  return {
    text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs previous`,
    up: pct >= 0,
  };
}
