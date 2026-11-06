// "use client";

// import { useEffect, useState } from "react";

// import { getAuthUser, getPermissions } from "@/libs/auth-storage";
// import type { AuthUser } from "@/types/auth";

// export function useAuth() {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [permissions, setPermissions] = useState<string[]>([]);

//   useEffect(() => {
//     setUser(getAuthUser());
//     setPermissions(getPermissions());
//   }, []);

//   return {
//     user,
//     permissions,
//     can: (permission: string) => permissions.includes(permission),
//   };
// }

"use client";

import { useState, useSyncExternalStore } from "react";

import { getAuthUser, getPermissions } from "@/libs/auth-storage";
import type { AuthUser } from "@/types/auth";

const subscribe = () => () => {};
export function useAuth() {
  const [user] = useState<AuthUser | null>(() => getAuthUser());
  const [permissions] = useState<string[]>(() => getPermissions());

  // false on the server and during hydration, true once mounted in the browser
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return {
    user,
    permissions,
    ready,
    can: (permission: string) => permissions.includes(permission),
  };
}
