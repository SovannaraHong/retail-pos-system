"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
} from "lucide-react";

import UserAvatar from "@/components/auth/user-avatar";
import { useAuth } from "@/hooks/use-auth";

type TopbarProps = {
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
  onLogout: () => void;
  notificationCount?: number;
};

export default function Topbar({
  onOpenMobile,
  onToggleCollapse,
  onLogout,
  notificationCount = 3,
}: TopbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // User information.
  const displayName = user?.name || user?.email || "User";
  const displayRole = user?.role?.[0] ?? "Staff";

  // Generate page title from URL.
  // Example: /dashboard -> Dashboard
  // Example: /purchase-orders -> Purchase Orders
  const pageTitle = (pathname.split("/").filter(Boolean)[0] ?? "dashboard")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-[#e8edf5] bg-white px-4 sm:px-6 lg:px-8">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-[#1c2740] transition hover:bg-[#f1f5fd] lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-[#1c2740] transition hover:bg-[#f1f5fd] lg:flex"
        >
          <PanelLeftClose size={20} />
        </button>

        {/* Page title */}
        <h1 className="truncate text-[17px] font-bold text-[#1c2740]">
          {pageTitle}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7a93]"
          />

          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
            className="h-10 w-52 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] pl-9 pr-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] md:w-72"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#1c2740] transition hover:bg-[#f1f5fd]"
        >
          <Bell size={21} />

          {notificationCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2f6fe8] px-1 text-[10px] font-semibold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-[#f1f5fd] sm:gap-3"
          >
            <UserAvatar user={user} />

            <span className="hidden text-left sm:block">
              <span className="block max-w-[150px] truncate text-[13px] font-semibold text-[#1c2740]">
                Hello, {displayName}
              </span>

              <span className="block text-[11px] capitalize text-[#7d8aa1]">
                {displayRole}
              </span>
            </span>

            <ChevronDown
              size={16}
              className={`hidden text-[#1c2740] transition-transform sm:block ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-[#e8edf5] bg-white p-2 shadow-lg"
            >
              {user?.email && (
                <p className="truncate px-3 pb-2 pt-1 text-xs text-[#7d8aa1]">
                  {user.email}
                </p>
              )}

              {/* Settings */}
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1c2740] transition hover:bg-[#f1f5fd]"
              >
                <CircleUserRound size={16} />
                Profile & settings
              </Link>

              <div className="my-1 border-t border-[#e8edf5]" />

              {/* Logout */}
              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
