"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, Coffee, X } from "lucide-react";

import UserAvatar from "@/components/auth/user-avatar";
import { navigation } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, permissions } = useAuth();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  const displayName = user?.name || user?.email || "User";
  const displayRole = user?.role?.[0] ?? "Staff";

  // Hide pages the user has no permission for, and empty groups.
  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || permissions.includes(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  function toggleGroup(title: string) {
    setClosedGroups((current) => ({ ...current, [title]: !current[title] }));
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#eee8e2] bg-white transition-all duration-200
        ${collapsed ? "w-[76px]" : "w-[250px]"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-[#f0ebe6] px-5">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
            onClick={onCloseMobile}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8643c] text-white">
              <Coffee size={23} />
            </span>

            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-bold tracking-tight">
                  Retail POS
                </span>
                <span className="block text-[11px] text-[#a49a91]">
                  MANAGEMENT SYSTEM
                </span>
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-[#887d74] hover:bg-[#f7f3ef] lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {visibleNavigation.map((group) => {
            const isOpen = !group.collapsible || !closedGroups[group.title];

            return (
              <section key={group.title}>
                {!collapsed && (
                  <button
                    type="button"
                    disabled={!group.collapsible}
                    onClick={() => toggleGroup(group.title)}
                    className="mb-2 flex w-full items-center justify-between px-3 text-[10px] font-bold tracking-[1.5px] text-[#a69b91] disabled:cursor-default"
                  >
                    {group.title}
                    {group.collapsible && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          isOpen ? "" : "-rotate-90"
                        }`}
                      />
                    )}
                  </button>
                )}

                {isOpen && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(`${item.href}/`));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          onClick={onCloseMobile}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors
                          ${
                            active
                              ? "bg-[#fff0e9] text-[#df6038]"
                              : "text-[#71665e] hover:bg-[#faf6f2] hover:text-[#332820]"
                          }
                          ${collapsed ? "justify-center" : ""}`}
                        >
                          <Icon size={18} strokeWidth={1.8} />
                          {!collapsed && <span>{item.label}</span>}
                          {!collapsed && active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e8643c]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        <div className="border-t border-[#f0ebe6] p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-[#92877e] hover:bg-[#f8f5f2] lg:flex"
          >
            <ChevronLeft
              size={17}
              className={`transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
            {!collapsed && "Collapse sidebar"}
          </button>

          <div
            className={`mt-2 flex items-center gap-3 rounded-xl bg-[#faf7f4] p-3 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <UserAvatar user={user} />

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                <p className="truncate text-[11px] capitalize text-[#a09489]">
                  {displayRole}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
