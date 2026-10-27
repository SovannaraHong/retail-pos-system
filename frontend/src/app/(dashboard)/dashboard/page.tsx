import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Coffee,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

// The page sits behind a client-side AuthGuard, so the server never renders it.
// Opt out of Next.js instant-navigation validation to silence the dev error.
export const instant = false;

const stats = [
  {
    label: "Total Revenue",
    value: "$12,840.50",
    change: "+12.8%",
    positive: true,
    note: "vs. last month",
    icon: CircleDollarSign,
    iconClass: "bg-[#fff0e8] text-[#e8643c]",
  },
  {
    label: "Total Orders",
    value: "1,284",
    change: "+8.2%",
    positive: true,
    note: "vs. last month",
    icon: ShoppingBag,
    iconClass: "bg-[#eaf3ff] text-[#4387d8]",
  },
  {
    label: "Total Products",
    value: "186",
    change: "+4.6%",
    positive: true,
    note: "vs. last month",
    icon: Coffee,
    iconClass: "bg-[#f1ebff] text-[#8b66d9]",
  },
  {
    label: "Low Stock Items",
    value: "12",
    change: "Needs attention",
    positive: false,
    note: "items running low",
    icon: Boxes,
    iconClass: "bg-[#fff4dc] text-[#c58a1a]",
  },
];

const sales = [
  { month: "Jan", revenue: 48, purchases: 28 },
  { month: "Feb", revenue: 65, purchases: 38 },
  { month: "Mar", revenue: 54, purchases: 32 },
  { month: "Apr", revenue: 78, purchases: 43 },
  { month: "May", revenue: 61, purchases: 36 },
  { month: "Jun", revenue: 88, purchases: 48 },
  { month: "Jul", revenue: 70, purchases: 39 },
  { month: "Aug", revenue: 95, purchases: 53 },
  { month: "Sep", revenue: 74, purchases: 44 },
  { month: "Oct", revenue: 86, purchases: 47 },
  { month: "Nov", revenue: 67, purchases: 34 },
  { month: "Dec", revenue: 100, purchases: 57 },
];

const products = [
  {
    name: "Caramel Macchiato",
    category: "Coffee",
    sold: 328,
    revenue: "$1,640.00",
  },
  {
    name: "Iced Americano",
    category: "Coffee",
    sold: 286,
    revenue: "$1,144.00",
  },
  { name: "Matcha Latte", category: "Tea", sold: 241, revenue: "$1,205.00" },
  { name: "Spanish Latte", category: "Coffee", sold: 198, revenue: "$990.00" },
];

const lowStock = [
  { name: "Fresh Milk", stock: 4, unit: "liters", level: "Critical" },
  { name: "Coffee Beans", stock: 8, unit: "kg", level: "Low" },
  { name: "Caramel Syrup", stock: 3, unit: "bottles", level: "Critical" },
  { name: "Paper Cups", stock: 15, unit: "packs", level: "Low" },
];

const orders = [
  {
    id: "ORD-20261027-001",
    customer: "Sokha Chan",
    amount: "$24.50",
    status: "Completed",
    time: "09:42 AM",
  },
  {
    id: "ORD-20261027-002",
    customer: "Dara Kim",
    amount: "$12.00",
    status: "Preparing",
    time: "10:05 AM",
  },
  {
    id: "ORD-20261027-003",
    customer: "Lina Heng",
    amount: "$18.75",
    status: "Pending",
    time: "10:18 AM",
  },
  {
    id: "ORD-20261027-004",
    customer: "Vanna Chea",
    amount: "$32.00",
    status: "Completed",
    time: "10:26 AM",
  },
];

function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-[#332820]">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-[#a09489]">{subtitle}</p>}
      </div>

      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#e8643c] hover:text-[#c84c27]"
        >
          View all <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-[#e8f7ee] text-[#24834a]",
    Preparing: "bg-[#fff1df] text-[#b97917]",
    Pending: "bg-[#edf2ff] text-[#4f6dc5]",
    Cancelled: "bg-[#ffeded] text-[#c54646]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function SalesChart() {
  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-2 text-[#71665e]">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#e8643c]" />
          Revenue
        </span>
        <span className="flex items-center gap-2 text-[#71665e]">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#e5d5c8]" />
          Purchases
        </span>
      </div>

      <div className="flex h-[220px] w-full gap-3 sm:gap-5">
        <div className="flex flex-col justify-between pb-6 text-[10px] text-[#a79c92]">
          <span>$10k</span>
          <span>$7.5k</span>
          <span>$5k</span>
          <span>$2.5k</span>
          <span>$0</span>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-0 bottom-6 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((line) => (
              <div
                key={line}
                className="border-t border-dashed border-[#eee8e2]"
              />
            ))}
          </div>

          <div className="relative flex flex-1 items-end justify-between gap-1 sm:gap-3">
            {sales.map((item) => (
              <div
                key={item.month}
                className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 sm:gap-1"
              >
                <div
                  title={`${item.month} revenue`}
                  className="w-[45%] max-w-5 rounded-t-[3px] bg-[#e8643c] transition-opacity hover:opacity-75"
                  style={{ height: `${item.revenue}%` }}
                />
                <div
                  title={`${item.month} purchases`}
                  className="w-[45%] max-w-5 rounded-t-[3px] bg-[#e5d5c8] transition-opacity hover:opacity-75"
                  style={{ height: `${item.purchases}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between gap-1 text-[9px] text-[#a79c92] sm:text-[10px]">
            {sales.map((item) => (
              <span key={item.month} className="flex-1 text-center">
                {item.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#a09489]">
            <span>Overview</span>
            <span>/</span>
            <span className="font-medium text-[#e8643c]">Dashboard</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#332820] sm:text-[28px]">
            Dashboard Overview
          </h1>
          <p className="mt-1.5 text-sm text-[#95897f]">
            Welcome back! Here&apos;s what&apos;s happening with your business
            today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-[#eee8e2] bg-white px-3 text-xs text-[#71665e]">
            <CalendarDays size={15} className="text-[#e8643c]" />
            October 27, 2026
          </div>
          <Link
            href="/orders"
            className="flex h-10 items-center gap-2 rounded-xl bg-[#e8643c] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#d65530]"
          >
            <ShoppingBag size={15} />
            View Orders
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#eee8e2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#95897f]">
                    {stat.label}
                  </p>
                  <h2 className="mt-3 text-[26px] font-bold tracking-tight text-[#332820]">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  <Icon size={21} strokeWidth={1.8} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px]">
                {stat.positive ? (
                  <ArrowUpRight size={14} className="text-[#26945a]" />
                ) : (
                  <ArrowDownRight size={14} className="text-[#d18b20]" />
                )}
                <span
                  className={`font-semibold ${
                    stat.positive ? "text-[#26945a]" : "text-[#d18b20]"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-[#a09489]">{stat.note}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#eee8e2] bg-white p-5 sm:p-6 xl:col-span-2">
          <SectionHeading
            title="Sales Overview"
            subtitle="Revenue and purchase trends throughout the year"
          />

          <SalesChart />

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#f0ebe6] pt-5 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-[#a09489]">Total Revenue</p>
              <p className="mt-1 text-lg font-bold text-[#332820]">
                $12,840.50
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#a09489]">Total Purchases</p>
              <p className="mt-1 text-lg font-bold text-[#332820]">$4,280.00</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] text-[#a09489]">Net Difference</p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold text-[#26945a]">
                $8,560.50 <TrendingUp size={15} />
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eee8e2] bg-white p-5 sm:p-6">
          <SectionHeading
            title="Quick Summary"
            subtitle="Your business at a glance"
          />

          <div className="space-y-5">
            {[
              {
                label: "Total Customers",
                value: "864",
                icon: Users,
                color: "bg-[#eaf3ff] text-[#4387d8]",
              },
              {
                label: "Active Products",
                value: "174",
                icon: Package,
                color: "bg-[#f1ebff] text-[#8b66d9]",
              },
              {
                label: "Pending Orders",
                value: "18",
                icon: Clock3,
                color: "bg-[#fff4dc] text-[#c58a1a]",
              },
              {
                label: "Completed Orders",
                value: "1,102",
                icon: ShoppingBag,
                color: "bg-[#e8f7ee] text-[#24834a]",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={19} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#95897f]">{item.label}</p>
                    <p className="mt-1 text-lg font-bold text-[#332820]">
                      {item.value}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#c1b6ac]" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#eee8e2] bg-white p-5 sm:p-6">
          <SectionHeading
            title="Top Selling Products"
            subtitle="Your best-performing products"
            href="/products"
          />

          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e8] text-[#e8643c]">
                  {index === 0 ? <Coffee size={19} /> : <Package size={19} />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#332820]">
                    {product.name}
                  </p>
                  <p className="mt-1 text-[11px] text-[#a09489]">
                    {product.category} · {product.sold} sold
                  </p>
                </div>

                <p className="shrink-0 text-xs font-bold text-[#332820]">
                  {product.revenue}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eee8e2] bg-white p-5 sm:p-6">
          <SectionHeading
            title="Low Stock Ingredients"
            subtitle="Items that need replenishment"
            href="/ingredients"
          />

          <div className="space-y-4">
            {lowStock.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4dc] text-[#c58a1a]">
                  <Boxes size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#332820]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[11px] text-[#a09489]">
                    {item.stock} {item.unit} remaining
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    item.level === "Critical"
                      ? "bg-[#ffeded] text-[#c54646]"
                      : "bg-[#fff4dc] text-[#b97917]"
                  }`}
                >
                  {item.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#eee8e2] bg-white">
        <div className="p-5 sm:p-6">
          <SectionHeading
            title="Recent Orders"
            subtitle="The latest transactions from your store"
            href="/orders"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <thead>
              <tr className="border-y border-[#f0ebe6] bg-[#fcfaf8]">
                {["Order ID", "Customer", "Date", "Amount", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a09489]"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#f5f0eb] last:border-0 hover:bg-[#fdfbf9]"
                >
                  <td className="px-5 py-4 text-xs font-semibold text-[#e8643c]">
                    {order.id}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[#51463e]">
                    {order.customer}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#95897f]">
                    Oct 27, {order.time}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-[#332820]">
                    {order.amount}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#f0ebe6] px-5 py-4">
          <p className="text-[11px] text-[#a09489]">
            Showing {orders.length} recent orders
          </p>
          <Link
            href="/orders"
            className="flex items-center gap-1 text-xs font-semibold text-[#e8643c] hover:text-[#c84c27]"
          >
            All orders <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-2 pb-2 text-[11px] text-[#a09489] sm:flex-row">
        <p>© 2026 Retail POS Management System</p>
        <p>Dashboard overview</p>
      </footer>
    </div>
  );
}
