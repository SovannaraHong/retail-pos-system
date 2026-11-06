import {
  LayoutDashboard,
  // Package,
  Coffee,
  Users,
  Truck,
  Settings,
  ClipboardList,
  Tags,
  UserCog,
  ShieldCheck,
  KeyRound,
  BadgeCheck,
  PackageSearch,
  Receipt,
  RotateCcw,
  CreditCard,
  Clock,
  Wallet,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
};

export type NavGroup = {
  title: string;
  collapsible?: boolean;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Reports",
        href: "/reports",
        icon: FileBarChart,
        permission: "reports.view",
      },
    ],
  },
  {
    title: "SALES",
    collapsible: true,
    items: [
      {
        label: "Sales",
        href: "/sales",
        icon: Receipt,
        permission: "sales.view",
      },
      {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
        permission: "payments.view",
      },
      {
        label: "Returns",
        href: "/returns",
        icon: RotateCcw,
        permission: "returns.view",
      },
      {
        label: "Shifts",
        href: "/shifts",
        icon: Clock,
        permission: "shifts.view",
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        permission: "customers.view",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    collapsible: true,
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Coffee,
        permission: "products.view",
      },
      {
        label: "Categories",
        href: "/categories",
        icon: Tags,
        permission: "categories.view",
      },
      {
        label: "Brands",
        href: "/brands",
        icon: BadgeCheck,
        permission: "brands.view",
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        permission: "suppliers.view",
      },
    ],
  },
  {
    title: "INVENTORY",
    collapsible: true,
    items: [
      {
        label: "Stocks",
        href: "/stocks",
        icon: PackageSearch,
        permission: "stocks.view",
      },
      {
        label: "Purchases",
        href: "/purchases",
        icon: ClipboardList,
        permission: "purchases.view",
      },
    ],
  },
  {
    title: "FINANCE",
    collapsible: true,
    items: [
      {
        label: "Expenses",
        href: "/expenses",
        icon: Wallet,
        permission: "expenses.view",
      },
    ],
  },
  {
    title: "ACCESS CONTROL",
    collapsible: true,
    items: [
      {
        label: "Staff",
        href: "/users",
        icon: UserCog,
        permission: "users.view",
      },
      {
        label: "Roles",
        href: "/roles",
        icon: ShieldCheck,
        permission: "roles.view",
      },
      {
        label: "Permissions",
        href: "/permissions",
        icon: KeyRound,
        permission: "permissions.view",
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
    ],
  },
];

const routePermissions: [string, string][] = navigation
  .flatMap((group) => group.items)
  .filter((item): item is NavItem & { permission: string } =>
    Boolean(item.permission),
  )
  .map((item) => [item.href, item.permission]);

export function getRequiredPermission(pathname: string): string | undefined {
  const match = routePermissions
    .filter(([href]) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1];
}
