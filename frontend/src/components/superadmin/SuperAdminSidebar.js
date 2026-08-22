"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SA_NAV } from "./SANavData";
import { usePermissions } from "@/hooks/usePermissions";
import { getRoleDisplayName, getRoleColor } from "@/config/rolePermissions";

// ── Helper: determine if any child path matches current pathname ─────────────
function groupIsActive(group, pathname) {
  if (!group.children) return pathname === group.href;
  return group.children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  );
}

// ── Sidebar Group Component ───────────────────────────────────────────────────
function NavGroup({ group, pathname, isOpen, onToggle, onLinkClick, isCollapsed }) {
  const active = groupIsActive(group, pathname);

  // Single link (no children)
  if (!group.children) {
    const isLinkActive = pathname === group.href;
    return (
      <Link
        href={group.href}
        onClick={onLinkClick}
        title={isCollapsed ? group.label : undefined}
        className={`flex items-center gap-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
          isCollapsed ? "justify-center w-10 h-10 mx-auto px-0 py-0" : "px-3 py-2.5"
        } ${
          isLinkActive
            ? "bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow"
            : "text-white/70 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="text-base leading-none shrink-0">{group.icon}</span>
        {!isCollapsed && <span>{group.label}</span>}
      </Link>
    );
  }

  // Group with children
  return (
    <div className="flex flex-col gap-0.5">
      {/* Group header */}
      <button
        type="button"
        onClick={() => onToggle(group.id)}
        title={isCollapsed ? group.label : undefined}
        className={`w-full flex items-center justify-between gap-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isCollapsed ? "justify-center w-10 h-10 mx-auto px-0 py-0" : "px-3 py-2.5"
        } ${
          active
            ? "text-white bg-white/10"
            : "text-white/70 hover:text-white hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-base leading-none shrink-0">{group.icon}</span>
          {!isCollapsed && <span className="text-left">{group.label}</span>}
        </div>
        {!isCollapsed && (
          <svg
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Children */}
      {isOpen && (
        <div className={`${isCollapsed ? "mt-1 flex flex-col gap-1 items-center" : "ml-4 mt-1 border-l border-white/10 pl-3 flex flex-col gap-0.5"}`}>
          {group.children.map((child) => {
            const childActive =
              pathname === child.href || pathname.startsWith(child.href + "/");
            return (
              <Link
                key={child.id}
                href={child.href}
                onClick={onLinkClick}
                title={isCollapsed ? child.label : undefined}
                className={`flex items-center gap-2 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                  isCollapsed ? "justify-center w-8 h-8 px-0 py-0" : "px-3 py-2"
                } ${
                  childActive
                    ? "bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    childActive ? "bg-white" : "bg-white/30"
                  }`}
                />
                {!isCollapsed && child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({
  pathname,
  openGroups,
  onToggle,
  onLinkClick,
  user,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  forceExpand = false,
}) {
  const collapsed = isCollapsed && !forceExpand;
  const { filterNav } = usePermissions();

  // Filter nav based on current user's role
  const filteredNav = useMemo(() => filterNav(SA_NAV), [filterNav]);

  // Role badge colors
  const role = user?.role;
  const roleLabel = getRoleDisplayName(role);
  const roleColor = getRoleColor(role);

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header: Logo + Collapse Button */}
      <div className="px-5 pt-5 pb-4 shrink-0 flex flex-col gap-3 select-none">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <img
              src="/Companye Logo.png"
              alt="BeeShip"
              className="h-7 object-contain"
            />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center bg-indigo-600/10 rounded-lg text-indigo-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4l3 6 6-3-3 12H6L3 7l6 3 3-6z" />
              </svg>
            </div>
          )}

          {!forceExpand && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer shrink-0"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {!collapsed && (
          <div className={`flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-xl border ${
            roleColor === "indigo" ? "bg-indigo-500/20 border-indigo-400/30" :
            roleColor === "blue"   ? "bg-blue-500/20 border-blue-400/30" :
            roleColor === "emerald"? "bg-emerald-500/20 border-emerald-400/30" :
            roleColor === "amber"  ? "bg-amber-500/20 border-amber-400/30" :
            roleColor === "sky"    ? "bg-sky-500/20 border-sky-400/30" :
            roleColor === "violet" ? "bg-violet-500/20 border-violet-400/30" :
                                     "bg-purple-500/20 border-purple-400/30"
          }`}>
            <svg className={`w-3 h-3 ${
              roleColor === "indigo" ? "text-indigo-300" :
              roleColor === "blue"   ? "text-blue-300" :
              roleColor === "emerald"? "text-emerald-300" :
              roleColor === "amber"  ? "text-amber-300" :
              roleColor === "sky"    ? "text-sky-300" :
              roleColor === "violet" ? "text-violet-300" :
                                       "text-purple-300"
            }`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span className={`text-xs font-bold ${
              roleColor === "indigo" ? "text-indigo-300" :
              roleColor === "blue"   ? "text-blue-300" :
              roleColor === "emerald"? "text-emerald-300" :
              roleColor === "amber"  ? "text-amber-300" :
              roleColor === "sky"    ? "text-sky-300" :
              roleColor === "violet" ? "text-violet-300" :
                                       "text-purple-300"
            }`}>{roleLabel}</span>
          </div>
        )}
      </div>

      {/* Nav — filtered by role */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 no-scrollbar">
        {filteredNav.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            pathname={pathname}
            isOpen={openGroups.has(group.id)}
            onToggle={onToggle}
            onLinkClick={onLinkClick}
            isCollapsed={collapsed}
          />
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className={`py-4 border-t border-white/10 shrink-0 ${collapsed ? "px-0" : "px-4"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[9px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0"
              title={`${user?.firstName} ${user?.lastName} (${user?.email})`}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Log Out" : undefined}
          className={`flex items-center gap-2.5 rounded-xl text-[11px] font-semibold text-white/60 hover:text-white hover:bg-white/5 transition cursor-pointer ${
            collapsed ? "justify-center w-10 h-10 mx-auto px-0 py-0" : "w-full px-3 py-2"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapse State
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("beeship_sa_sidebar_collapsed") === "true";
    }
    return false;
  });

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("beeship_sa_sidebar_collapsed", String(next));
      }
      return next;
    });
  }, []);

  // Auto-open the group that contains the active route
  const initialOpen = useMemo(() => {
    const set = new Set();
    SA_NAV.forEach((g) => {
      if (g.children && groupIsActive(g, pathname)) {
        set.add(g.id);
      }
    });
    return set;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [openGroups, setOpenGroups] = useState(initialOpen);

  const handleToggle = useCallback((id) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sharedProps = {
    pathname,
    openGroups,
    onToggle: handleToggle,
    onLinkClick: () => setMobileOpen(false),
    user,
    onLogout: logout,
    isCollapsed,
    onToggleCollapse: handleToggleCollapse,
  };

  // Derive mobile header label from active nav item
  const activeGroup = SA_NAV.find((g) => groupIsActive(g, pathname));
  const activeChild = activeGroup?.children?.find(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  );
  const mobileLabel = activeChild?.label || activeGroup?.label || "Super Admin";

  return (
    <>
      {/* ── Mobile Trigger Bar ─────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between bg-[#0a0f2c] border-b border-white/10 px-4 py-3 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">{mobileLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">👑</span>
          <img src="/Companye Logo.png" alt="BeeShip" className="h-5 object-contain" />
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-[#0a0f2c] border-r border-white/10 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-white/60 hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent {...sharedProps} forceExpand={true} />
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#0a0f2c] border-r border-white/10 sticky top-0 h-screen overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent {...sharedProps} forceExpand={false} />
      </aside>
    </>
  );
}
