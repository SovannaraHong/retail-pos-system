import { AuthUser, LoginResponse } from "@/types/auth";

const KEYS = [
  "access_token",
  "token_type",
  "token_expires_at",
  "auth_user",
  "permissions",
] as const;

export function saveSession(response: LoginResponse) {
  sessionStorage.setItem("access_token", response.access_token);
  sessionStorage.setItem("token_type", response.token_type);

  sessionStorage.setItem(
    "token_expires_at",
    String(Date.now() + response.expires_in * 1000),
  );

  sessionStorage.setItem("auth_user", JSON.stringify(response.user));

  sessionStorage.setItem(
    "permissions",
    JSON.stringify(response.permission ?? []),
  );
}
export function clearSession() {
  KEYS.forEach((key) => sessionStorage.removeItem(key));
}
export function getExpiresAt(): number {
  return Number(sessionStorage.getItem("token_expires_at")) || 0;
}
export function getValidToken(): string | null {
  const token = sessionStorage.getItem("access_token");
  if (!token) return null;

  const expiresAt = getExpiresAt();
  if (expiresAt && expiresAt <= Date.now()) return null;

  return token;
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem("auth_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getPermissions(): string[] {
  try {
    const raw = sessionStorage.getItem("permissions");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasPermission(permission?: string): boolean {
  if (!permission) return true;
  return getPermissions().includes(permission);
}

export function hasRole(role: string): boolean {
  return getAuthUser()?.role?.includes(role) ?? false;
}
