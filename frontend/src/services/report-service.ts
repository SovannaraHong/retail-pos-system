import { api } from "@/libs/api-client";
import { chartRange, previousRange } from "@/libs/date-range";
import type {
  Cashier,
  CategorySales,
  CustomerRow,
  DateRange,
  DayPoint,
  ExpenseCategory,
  GroupBy,
  HourPoint,
  Insights,
  LowStockItem,
  Overview,
  RecentSale,
  ReportQuery,
  SortKey,
  StockValue,
  Summary,
  TopProduct,
} from "@/types/report";

/* ------------------------------ helpers ------------------------------ */

function buildQuery(params?: ReportQuery): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.append(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Res<T = any> = { data: T; meta?: any };
const get = <T = any>(path: string, q?: ReportQuery) =>
  api.get<Res<T>>(`/reports/${path}${buildQuery(q)}`);

const n = (v: unknown) => Number(v) || 0;
const rows = (r: any): any[] => (Array.isArray(r) ? r : []);
const q = (r: DateRange): ReportQuery => ({ date_from: r.from, date_to: r.to });

/* ------------------- mappers: exact names from ReportService.php ------------------- */

const toSummary = (r: any): Summary => ({
  revenue: n(r?.net_sales),
  orders: n(r?.sales_count),
  grossProfit: n(r?.gross_profit),
  netProfit: n(r?.net_profit),
  expenses: n(r?.expenses),
  refunds: n(r?.refunds),
  discounts: n(r?.discounts),
  tax: n(r?.tax_collected),
  items: n(r?.items_sold),
  avg: n(r?.average_sale),
  margin: n(r?.margin_percent),
  voidedCount: n(r?.voided_count),
  voidedAmount: n(r?.voided_amount),
  payments: rows(r?.payments_by_method).map((p) => ({
    method: String(p.method ?? "other"),
    count: n(p.payments),
    total: n(p.total),
  })),
});

const toDay = (r: any): DayPoint => ({
  date: String(r?.date ?? "").slice(0, 10),
  revenue: n(r?.net_sales),
  orders: n(r?.sales_count),
  profit: n(r?.net_profit),
});

const toTop = (r: any): TopProduct => ({
  image_url: r?.image_url,
  name: r?.name ?? "—",
  qty: n(r?.qty_sold),
  revenue: n(r?.revenue),
  profit: n(r?.profit),
});

const toCashier = (r: any): Cashier => ({
  name: r?.name ?? "—",
  orders: n(r?.sales_count),
  revenue: n(r?.gross_sales),
});

const toLow = (r: any): LowStockItem => ({
  name: r?.name ?? "—",
  stock: n(r?.stock_qty),
  reorder: n(r?.reorder_level),
});

const toStockValue = (r: any): StockValue => ({
  cost: n(r?.cost_value),
  retail: n(r?.retail_value),
  items: n(r?.products_in_stock),
  outOfStock: n(r?.out_of_stock),
});

const toHour = (r: any): HourPoint => ({
  hour: n(r?.hour),
  orders: n(r?.sales_count),
  revenue: n(r?.gross_sales),
});

const toCategory = (r: any): CategorySales => ({
  name: r?.category ?? "No category",
  qty: n(r?.qty_sold),
  revenue: n(r?.revenue),
  profit: n(r?.profit),
});

const toExpenseCat = (r: any): ExpenseCategory => ({
  name: r?.category ?? "No category",
  count: n(r?.count),
  total: n(r?.total),
});

const toCustomer = (r: any): CustomerRow => ({
  name: r?.name ?? "—",
  orders: n(r?.sales_count),
  total: n(r?.gross_sales),
});

const toRecent = (r: any): RecentSale => ({
  id: n(r?.id),
  invoice: String(r?.invoice ?? r?.id ?? ""),
  customer: r?.customer ?? "Walk-in",
  cashier: r?.cashier ?? "—",
  total: n(r?.total),
  status: String(r?.status ?? ""),
  soldAt: String(r?.sold_at ?? ""),
});

/* --------------------------------- Service --------------------------------- */

export const ReportService = {
  /** Cards, trend, low stock, cashiers: fetched in parallel. */
  async overview(range: DateRange, groupBy: GroupBy): Promise<Overview> {
    const prev = previousRange(range);
    const [summary, previous, daily, cashiers, low, stock] = await Promise.all([
      get("summary", q(range)),
      get("summary", q(prev)),
      get("daily", { ...q(chartRange(range)), group_by: groupBy }),
      get("cashiers", q(range)),
      get("low-stock", { limit: 5 }),
      get("stock-value"),
    ]);

    return {
      summary: toSummary(summary.data),
      previous: toSummary(previous.data),
      daily: rows(daily.data).map(toDay),
      groupBy: daily.meta?.group_by ?? "day",
      cashiers: rows(cashiers.data).map(toCashier),
      lowStock: rows(low.data).map(toLow),
      lowStockTotal: n(low.meta?.total ?? rows(low.data).length),
      stockValue: toStockValue(stock.data),
    };
  },

  /** Hours, categories, expenses, customers, latest sales. */
  async insights(range: DateRange): Promise<Insights> {
    const [hourly, categories, expenses, customers, recent] = await Promise.all(
      [
        get("hourly", q(range)),
        get("categories", { ...q(range), limit: 6 }),
        get("expenses", q(range)),
        get("customers", { ...q(range), limit: 5 }),
        get("recent-sales", { ...q(range), limit: 8 }),
      ],
    );

    return {
      hourly: rows(hourly.data).map(toHour),
      categories: rows(categories.data).map(toCategory),
      expenses: rows(expenses.data).map(toExpenseCat),
      customers: rows(customers.data).map(toCustomer),
      recent: rows(recent.data).map(toRecent),
    };
  },

  topProducts(range: DateRange, sort: SortKey = "qty", limit = 5) {
    return get("top-products", { ...q(range), sort, limit }).then((res) =>
      rows(res.data).map(toTop),
    );
  },
};
