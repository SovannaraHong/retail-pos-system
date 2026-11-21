"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronDown,
  CircleUserRound,
  ExternalLink,
  Info,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  Search,
} from "lucide-react";

import UserAvatar from "@/components/auth/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";

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
}: TopbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // User information.
  const displayName = user?.name || user?.email || "User";
  const displayRole = user?.role?.[0] ?? "Staff";

  // Generate page title from URL.
  const pageTitle = (pathname.split("/").filter(Boolean)[0] ?? "dashboard")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Close dropdowns when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e9eef7] bg-white px-3 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-[#1c2740] hover:bg-[#f1f5fd] lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapse trigger */}
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-[#1c2740] hover:bg-[#f1f5fd] lg:block"
        >
          <PanelLeftClose size={20} />
        </button>

        {/* Page title */}
        <h1 className="text-base font-bold text-[#1c2740] sm:text-xl">
          {pageTitle}
        </h1>
      </div>

      {/* Right side */}
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

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setNotifMenuOpen((open) => !open);
              setUserMenuOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#1c2740] transition hover:bg-[#f1f5fd]"
          >
            <Bell size={21} />

            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e5484d] px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-[#e8edf5] bg-white p-3 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#f0f4f9] pb-2.5 px-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1c2740]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#fef2f2] px-2 py-0.5 text-[10px] font-bold text-[#ef4444]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#2f6fe8] hover:underline"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="mt-2 max-h-80 divide-y divide-[#f1f4f9] overflow-y-auto [scrollbar-width:thin]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#7d8aa1]">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`flex items-start gap-3 p-2.5 transition rounded-xl cursor-pointer ${
                        n.read ? "bg-white hover:bg-[#f8fafc]" : "bg-[#f4f7fc]/70 hover:bg-[#eaf0fa]"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          n.type === "low_stock"
                            ? "bg-[#fff1d8] text-[#d97706]"
                            : "bg-[#e8f0ff] text-[#2f6fe8]"
                        }`}
                      >
                        {n.type === "low_stock" ? (
                          <AlertTriangle size={16} />
                        ) : (
                          <Info size={16} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`truncate text-xs ${n.read ? "font-semibold text-[#334155]" : "font-bold text-[#1c2740]"}`}>
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-[#94a3b8]">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#64748b] leading-tight">
                          {n.message}
                        </p>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setNotifMenuOpen(false)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-[#2f6fe8] hover:underline"
                          >
                            <span>Manage Stock</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>

                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2f6fe8]" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setNotifMenuOpen(false);
            }}
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

              {/* Logout */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#e5484d] transition hover:bg-[#ffeef0]"
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
