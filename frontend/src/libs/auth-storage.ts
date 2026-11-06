import type { AuthUser, LoginResponse } from "@/types/auth";

const KEYS = [
  "access_token",
  "token_type",
  "token_expires_at",
  "auth_user",
  "permissions",
] as const;

/**
 * Save authentication data after successful login.
 */
export function saveSession(response: LoginResponse): void {
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

/**
 * Remove all authentication data.
 */
export function clearSession(): void {
  KEYS.forEach((key) => sessionStorage.removeItem(key));
}

/**
 * Get token expiration timestamp.
 */
export function getExpiresAt(): number {
  return Number(sessionStorage.getItem("token_expires_at")) || 0;
}

/**
 * Get a valid access token.
 */
export function getValidToken(): string | null {
  const token = sessionStorage.getItem("access_token");

  if (!token) return null;

  const expiresAt = getExpiresAt();

  if (!expiresAt || expiresAt <= Date.now()) {
    clearSession();
    return null;
  }

  return token;
}

/**
 * Get authenticated user.
 */
export function getAuthUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem("auth_user");

    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * Get user permissions.
 */
export function getPermissions(): string[] {
  try {
    const raw = sessionStorage.getItem("permissions");
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check whether user has a permission.
 */
export function hasPermission(permission?: string): boolean {
  if (!permission) return true;

  return getPermissions().includes(permission);
}

/**
 * Check whether user has a role.
 */
export function hasRole(role: string): boolean {
  return getAuthUser()?.role?.includes(role) ?? false;
}
