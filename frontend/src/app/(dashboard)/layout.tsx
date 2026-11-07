"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getRequiredPermission } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { setUnauthorizedHandler } from "@/libs/api-client";
import { clearSession } from "@/libs/auth-storage";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { ready, user, can } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get the permission required by the current route.
  const requiredPermission = getRequiredPermission(pathname);

  // Check whether the user has permission.
  const allowed = !requiredPermission || can(requiredPermission);

  // Authentication and authorization guard.
  useEffect(() => {
    if (!ready) return;

    // Redirect unauthenticated users.
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect users without permission.
    if (!allowed && pathname !== "/forbidden") {
      router.replace("/forbidden");
    }
  }, [ready, user, allowed, pathname, router]);

  // When any API call returns 401, send the user to login (no full page reload).
  useEffect(() => {
    setUnauthorizedHandler((returnUrl) => {
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  // Logout handler.
  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  // Show loading screen until authentication is ready.
  if (!ready || !user || (!allowed && pathname !== "/forbidden")) {
    return <div className="min-h-screen bg-[#f7f6f5]" />;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f5]">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[84px]" : "lg:pl-[250px]"
        }`}
      >
        {/* Topbar */}
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((current) => !current)}
          onLogout={handleLogout}
        />

        {/* Page content */}
        <main className="w-full min-w-0 flex-1 px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
