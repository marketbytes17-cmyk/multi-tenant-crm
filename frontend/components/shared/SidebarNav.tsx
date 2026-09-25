"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/lib/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  GitMerge,
  Cpu,
  UserCheck,
  BarChart3,
  Settings,
  Filter,
  Kanban,
  UserGroupIcon as UserGroup,
  TrendingUp,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
    { label: "Clients", href: "/superadmin/clients", icon: Briefcase },
    { label: "Lead Routing", href: "/superadmin/routing", icon: GitMerge },
    { label: "Meta Integration", href: "/superadmin/integration", icon: Cpu },
    { label: "Client Admins", href: "/superadmin/users", icon: UserCheck },
    { label: "Reports", href: "/superadmin/reports", icon: BarChart3 },
    { label: "Settings", href: "/superadmin/settings", icon: Settings },
  ],
  client_admin: [
    { label: "Dashboard", href: "/client", icon: LayoutDashboard },
    { label: "Leads Inbox", href: "/client/leads", icon: Filter },
    { label: "Pipeline", href: "/client/pipeline", icon: Kanban },
    { label: "Team", href: "/client/team", icon: Users },
    { label: "Reports", href: "/client/reports", icon: BarChart3 },
    { label: "Settings", href: "/client/settings", icon: Settings },
  ],
  sales_rep: [
    { label: "Dashboard", href: "/rep", icon: LayoutDashboard },
    { label: "My Leads", href: "/rep/leads", icon: Filter },
    { label: "My Pipeline", href: "/rep/pipeline", icon: Kanban },
    { label: "My Performance", href: "/rep/performance", icon: TrendingUp },
    { label: "Settings", href: "/rep/settings", icon: Settings },
  ],
};

interface SidebarNavProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SidebarNav({ isCollapsed, onToggleCollapse }: SidebarNavProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const role = user?.role || "client_admin";
  const navItems = ROLE_NAV_ITEMS[role];

  return (
    <aside
      className={`bg-[#030712] text-[#FFFFFF] flex flex-col transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? "w-16" : "w-[212px]"
      } max-[760px]:w-full max-[760px]:h-14 max-[760px]:flex-row max-[760px]:items-center max-[760px]:justify-between max-[760px]:px-4 max-[760px]:border-b max-[760px]:border-[#2B2B2F]`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1E2440]/40 max-[760px]:border-b-0 max-[760px]:px-0">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-[9px] bg-[#155DFC] flex items-center justify-center font-heading font-bold text-white text-[15px] shrink-0 shadow-sm">
            M
          </div>
          {!isCollapsed && (
            <span className="font-heading font-bold text-[15px] text-[#FFFFFF] tracking-tight whitespace-nowrap max-[760px]:inline">
              MarketBytes
            </span>
          )}
        </Link>

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex text-[#6B7280] hover:text-[#FFFFFF] p-1 rounded hover:bg-[#1E2440]/60 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto max-[760px]:p-0 max-[760px]:space-y-0 max-[760px]:flex max-[760px]:items-center max-[760px]:gap-1 max-[760px]:overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/client" && item.href !== "/superadmin" && item.href !== "/rep" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-[9px] text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-[#D5E3FC] text-[#155DFC] font-semibold"
                  : "text-[#8B93A1] hover:text-[#FFFFFF] hover:bg-[#121827]"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#155DFC]" : "text-[#8B93A1]"
                }`}
              />
              {!isCollapsed && <span className="truncate max-[760px]:hidden">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Role Badge Footer (Desktop only) */}
      {!isCollapsed && user && (
        <div className="p-3 border-t border-[#1E2440]/40 max-[760px]:hidden">
          <div className="bg-[#121827] rounded-[9px] p-2.5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider">Role</p>
              <p className="text-[12px] font-semibold text-[#FFFFFF] truncate font-heading">
                {user.role === "super_admin"
                  ? "Super Admin"
                  : user.role === "client_admin"
                  ? "Client Admin"
                  : "Sales Rep"}
              </p>
            </div>
            <Zap className="w-3.5 h-3.5 text-[#155DFC] shrink-0" />
          </div>
        </div>
      )}
    </aside>
  );
}
