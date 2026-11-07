// types/shift.ts
export interface ShiftSummary {
  sales_count: number;
  sales_total: number;
  by_method: Record<string, number>;
  cash_sales: number;
  cash_refunds: number;
  expected_cash: number;
}

export interface Shift {
  id: number;
  status: "open" | "closed";
  user: { id: number; name: string } | null;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  difference: number | null; // + over, - short
  note: string | null;
  opened_at: string;
  closed_at: string | null;
  summary?: ShiftSummary;
}

export interface OpenShiftPayload {
  opening_cash: number;
  note?: string;
}

export interface CloseShiftPayload {
  closing_cash: number;
  note?: string;
}
