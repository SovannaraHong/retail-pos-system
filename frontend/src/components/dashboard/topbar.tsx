"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  Search,
} from "lucide-react";

import UserAvatar from "@/components/auth/user-avatar";
import { useAuth } from "@/hooks/use-auth";

type TopbarProps = {
  onOpenMobile: () => void;
  onLogout: () => void;
};

export default function Topbar({ onOpenMobile, onLogout }: TopbarProps) {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name || user?.email || "User";
  const displayRole = user?.role?.[0] ?? "Staff";

  // Close the user menu when clicking outside of it.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#eee8e2] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenMobile}
          className="rounded-lg p-2 hover:bg-[#f7f3ef] lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="relative hidden sm:block">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a79c92]"
          />
          <input
            type="search"
            placeholder="Search anything..."
            className="h-10 w-52 rounded-xl border border-[#eee8e2] bg-[#fbfaf9] pl-9 pr-3 text-xs outline-none transition focus:border-[#e8643c] md:w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#786d64] hover:bg-[#faf5f1]"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#e8643c]" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[#faf5f1]"
          >
            <UserAvatar user={user} />
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold">{displayName}</span>
              <span className="block text-[11px] capitalize text-[#a09489]">
                {displayRole}
              </span>
            </span>
            <ChevronDown size={15} className="hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-[#eee8e2] bg-white p-2 shadow-lg">
              {user?.email && (
                <p className="truncate px-3 pb-2 pt-1 text-xs text-[#a09489]">
                  {user.email}
                </p>
              )}

              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#faf5f1]"
              >
                <CircleUserRound size={16} />
                Profile &amp; settings
              </Link>

              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
