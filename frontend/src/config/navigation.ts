import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Coffee,
  Boxes,
  Users,
  Truck,
  BarChart3,
  Settings,
  ClipboardList,
  Tags,
  Warehouse,
  UserCog,
  ShieldCheck,
  KeyRound,
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
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "MANAGEMENT",
    collapsible: true,
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingCart },
      {
        label: "Products",
        href: "/products",
        icon: Coffee,
        permission: "products.view",
      },
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Ingredients", href: "/ingredients", icon: Boxes },
      { label: "Add-ons", href: "/addons", icon: Package },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    title: "INVENTORY",
    collapsible: true,
    items: [
      {
        label: "Purchase Orders",
        href: "/purchase-orders",
        icon: ClipboardList,
      },
      {
        label: "Inventory Transactions",
        href: "/inventory-transactions",
        icon: Warehouse,
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
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
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
