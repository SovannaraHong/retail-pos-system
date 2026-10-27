"use client";

import { getRequiredPermission } from "@/config/navigation";
import {
  clearSession,
  getExpiresAt,
  getValidToken,
  hasPermission,
} from "@/libs/auth-storage";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

type AuthGuardProps = {
  children: ReactNode;
};

const MAX_TIMEOUT = 2_147_483_647;

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Track which pathname has been checked.
  // The server and the first client render both show the spinner,
  // so there is no hydration mismatch and no storage access during render.
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    if (!getValidToken()) {
      clearSession();
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const required =
      pathname === "/forbidden" ? undefined : getRequiredPermission(pathname);

    if (required && !hasPermission(required)) {
      router.replace("/forbidden");
      return;
    }

    // Record the checked route asynchronously to avoid the lint warning.
    queueMicrotask(() => {
      if (active) {
        setCheckedPath(pathname);
      }
    });

    const expiresAt = getExpiresAt();

    if (expiresAt) {
      const delay = Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMEOUT);

      timer = window.setTimeout(() => {
        clearSession();
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      }, delay);
    }

    return () => {
      active = false;

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [pathname, router]);

  if (checkedPath !== pathname) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f5]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#e8643c] border-t-transparent" />
          <p className="mt-3 text-sm text-[#8b7d72]">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
