"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/components/auth/auth-guard";
import Topbar from "@/components/dashboard/topbar";
import { clearSession } from "@/libs/auth-storage";
import { authService } from "@/services/auth-service";
import Sidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    try {
      // Revoke the token on the server (Laravel POST /logout).
      await authService.logout();
    } catch {
      // Ignore errors, still log out locally.
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8f7f5] text-[#29231f]">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />

        <div
          className={`min-h-screen transition-[margin] duration-200 ${
            collapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"
          }`}
        >
          <Topbar onOpenMobile={() => setMobileOpen(true)} onLogout={logout} />

          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
