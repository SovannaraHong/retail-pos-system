"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  getAuthUser,
  getPermissions,
  getValidToken,
  subscribeSession,
} from "@/libs/auth-storage";
import type { AuthUser } from "@/types/auth";

type Snapshot = {
  user: AuthUser | null;
  permissions: string[];
};

const SERVER_SNAPSHOT: Snapshot = { user: null, permissions: [] };

// useSyncExternalStore needs the SAME object back until the data really changes,
// so we cache the snapshot by the raw stored strings.
let cacheKey = "";
let cacheValue: Snapshot = SERVER_SNAPSHOT;

function getSnapshot(): Snapshot {
  const token = getValidToken(); // also clears an expired session
  const rawUser = sessionStorage.getItem("auth_user") ?? "";
  const rawPerms = sessionStorage.getItem("permissions") ?? "";
  const key = `${token ?? ""}|${rawUser}|${rawPerms}`;

  if (key !== cacheKey) {
    cacheKey = key;
    cacheValue = token
      ? { user: getAuthUser(), permissions: getPermissions() }
      : SERVER_SNAPSHOT;
  }
  return cacheValue;
}

const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

// "mounted" is false on the server / hydration, true in the browser
const subscribeNoop = () => () => {};

export function useAuth() {
  const { user, permissions } = useSyncExternalStore(
    subscribeSession,
    getSnapshot,
    getServerSnapshot,
  );

  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const can = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  return useMemo(
    () => ({ user, permissions, ready, can }),
    [user, permissions, ready, can],
  );
}
