"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, LogOut, Store, X } from "lucide-react";

import { navigation } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  onLogout?: () => void; // pass the same logout handler you give Topbar
};

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#1957d6] to-[#2f80ff] transition-all duration-200
        ${collapsed ? "w-[84px]" : "w-[250px]"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand */}
        <div
          className={`relative flex flex-col items-center justify-center text-center text-white ${
            collapsed ? "h-[84px]" : "h-[150px]"
          }`}
        >
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onCloseMobile}
            className="absolute right-3 top-3 rounded-lg p-1 text-white/80 hover:bg-white/10 lg:hidden"
          >
            <X size={19} />
          </button>

          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex flex-col items-center"
          >
            <span
              className={`flex items-center justify-center rounded-2xl bg-white/15 ${
                collapsed ? "h-11 w-11" : "h-12 w-12"
              }`}
            >
              <Store size={collapsed ? 24 : 28} />
            </span>

            {!collapsed && (
              <>
                <span className="mt-2 text-[24px] font-extrabold leading-none tracking-wide">
                  RPOS
                </span>
                <span className="mt-1.5 text-[12px] leading-tight text-white/90">
                  Retail POS
                  <br />
                  Management System
                </span>
              </>
            )}
          </Link>
        </div>

        {/* White navigation card */}
        <div className="mx-2.5 mb-2.5 flex min-h-0 flex-1 flex-col rounded-2xl bg-white p-3 shadow-lg">
          {/* Scrollbar hidden; still scrolls with wheel/touch if needed */}
          <nav className="flex-1 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleNavigation.map((group) => {
              const isOpen = !group.collapsible || !closedGroups[group.title];

              return (
                <section key={group.title}>
                  {!collapsed && (
                    <button
                      type="button"
                      disabled={!group.collapsible}
                      onClick={() => toggleGroup(group.title)}
                      className="mb-1 flex w-full items-center justify-between px-3 text-[11px] font-semibold text-[#9aa5b8] disabled:cursor-default"
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
                    <div className="space-y-0.5">
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
                            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13.5px] font-medium transition-colors
                            ${
                              active
                                ? "bg-[#2f6fe8] text-white shadow-sm"
                                : "text-[#3d4a63] hover:bg-[#f1f5fd] hover:text-[#1d5fe0]"
                            }
                            ${collapsed ? "justify-center px-0" : ""}`}
                          >
                            <Icon size={18} strokeWidth={1.8} />
                            {!collapsed && <span>{item.label}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </nav>

          <div className="mt-2 space-y-0.5 border-t border-[#e8edf5] pt-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-[#8793a8] hover:bg-[#f1f5fd] lg:flex"
            >
              <ChevronLeft
                size={16}
                className={`transition-transform ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
              {!collapsed && "Collapse sidebar"}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13.5px] font-medium text-[#3d4a63] hover:bg-red-50 hover:text-red-600 ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <LogOut size={18} strokeWidth={1.8} className="text-red-500" />
              {!collapsed && "Logout"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
