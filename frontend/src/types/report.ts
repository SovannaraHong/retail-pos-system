export type PresetKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last_month"
  | "quarter"
  | "year";
export type RangeKey = PresetKey | "custom";
export type SortKey = "qty" | "revenue" | "profit";
export type GroupBy = "auto" | "day" | "week" | "month";

export const RANGES: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "year", label: "This Year" },
];

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}
export interface PickedRange extends DateRange {
  key: RangeKey;
}

export interface ReportQuery {
  date_from?: string;
  date_to?: string;
  limit?: number;
  sort?: SortKey;
  group_by?: GroupBy;
}

export interface PaymentRow {
  method: string;
  count: number;
  total: number;
}

export interface Summary {
  revenue: number; // net sales (gross - refunds, tax included)
  orders: number;
  grossProfit: number;
  netProfit: number;
  expenses: number;
  refunds: number;
  discounts: number;
  tax: number;
  items: number;
  avg: number;
  margin: number;
  voidedCount: number;
  voidedAmount: number;
  payments: PaymentRow[];
}
export interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}
export interface TopProduct {
  image_url: string;
  name: string;
  qty: number;
  revenue: number;
  profit: number;
}
export interface Cashier {
  name: string;
  orders: number;
  revenue: number;
}
export interface LowStockItem {
  name: string;
  stock: number;
  reorder: number;
}
export interface StockValue {
  cost: number;
  retail: number;
  items: number;
  outOfStock: number;
}

export interface HourPoint {
  hour: number;
  orders: number;
  revenue: number;
}
export interface CategorySales {
  name: string;
  qty: number;
  revenue: number;
  profit: number;
}
export interface ExpenseCategory {
  name: string;
  count: number;
  total: number;
}
export interface CustomerRow {
  name: string;
  orders: number;
  total: number;
}
export interface RecentSale {
  id: number;
  invoice: string;
  customer: string;
  cashier: string;
  total: number;
  status: string;
  soldAt: string;
}

export interface Overview {
  summary: Summary;
  previous: Summary;
  daily: DayPoint[];
  groupBy: Exclude<GroupBy, "auto">;
  cashiers: Cashier[];
  lowStock: LowStockItem[];
  lowStockTotal: number;
  stockValue: StockValue;
}

export interface Insights {
  hourly: HourPoint[];
  categories: CategorySales[];
  expenses: ExpenseCategory[];
  customers: CustomerRow[];
  recent: RecentSale[];
}
