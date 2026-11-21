import type { Permission } from "@/types/role";

export interface PermissionGroup {
  key: string; // "products"
  items: Permission[];
}

/** "products.view" -> group "products", action "view" */
export function groupPermissions(perms: Permission[]): PermissionGroup[] {
  const map = new Map<string, Permission[]>();
  for (const p of perms) {
    const key = p.name.includes(".") ? p.name.split(".")[0] : "other";
    map.set(key, [...(map.get(key) ?? []), p]);
  }
  return Array.from(map, ([key, items]) => ({ key, items })).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

export const actionOf = (name: string) =>
  name.includes(".") ? name.split(".").slice(1).join(".") : name;

export const titleCase = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
