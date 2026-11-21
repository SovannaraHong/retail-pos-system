export interface Permission {
  id: number;
  name: string; // "resource.action", e.g. "products.view"
  guard_name: string;
  created_at: string | null;
  updated_at?: string | null;
}

export interface PermissionPayload {
  name: string;
}

/** Same rule as the Laravel form requests. */
export const PERMISSION_NAME_RE = /^[a-z0-9_]+\.[a-z0-9_]+$/;

/** Permissions that manage access itself: the API refuses to rename/delete them. */
export const PROTECTED_PREFIX = "permissions.";

export const isProtectedPermission = (p: Pick<Permission, "name">) =>
  p.name.startsWith(PROTECTED_PREFIX);

export function splitPermission(name: string) {
  const [resource, ...rest] = name.split(".");
  return { resource, action: rest.join(".") };
}
