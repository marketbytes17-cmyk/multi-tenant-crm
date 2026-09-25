"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { Bell, LogOut, Shield, User, ChevronDown, Plus, Check } from "lucide-react";

export function TopBar() {
  const { user, logout, switchRole } = useAuth();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const mockNotifications = [
    { id: 1, text: "New lead arrived from Meta Ad Campaign", time: "5m ago", type: "new" },
    { id: 2, text: "Sarah assigned 3 unassigned leads to you", time: "1h ago", type: "assign" },
    { id: 3, text: "Meta webhook System Token health verified", time: "3h ago", type: "system" },
  ];

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setHasUnread(false);
  };

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left section: Client Org / Page title indicator */}
      <div className="flex items-center gap-3">
        {user?.clientName && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F1F2F4] rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#00BC7D]" />
            <span className="text-[12px] font-semibold text-[#030712] font-heading">{user.clientName}</span>
          </div>
        )}
      </div>

      {/* Right section: Actions, Bell, User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        {user?.role === "client_admin" && (
          <button
            onClick={() => toast("Opening lead creation form", "info")}
            className="hidden sm:flex items-center gap-1.5 bg-[#030712] text-[#FFFFFF] hover:bg-[#155DFC] text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        )}

        {/* Role Switcher (for quick demo / dev testing) */}
        <div className="relative">
          <select
            value={user?.role || "client_admin"}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-[#F1F2F4] border-0 text-[11.5px] font-semibold text-[#030712] py-1 px-2.5 rounded-full cursor-pointer focus:ring-0 focus:outline-none hover:bg-[#E3E7EF] transition-colors"
            title="Switch demo role"
          >
            <option value="super_admin">Super Admin View</option>
            <option value="client_admin">Client Admin View</option>
            <option value="sales_rep">Sales Rep View</option>
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleNotificationClick}
            className="w-8 h-8 rounded-full bg-[#F1F2F4] flex items-center justify-center text-[#6B7280] hover:text-[#030712] hover:bg-[#E3E7EF] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#FB3038] ring-1.5 ring-[#FFFFFF]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] shadow-card p-3 z-50 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-2">
                <h4 className="font-heading font-bold text-[13px] text-[#030712]">Notifications</h4>
                <span className="text-[11px] text-[#155DFC] font-medium cursor-pointer" onClick={() => toast("All notifications marked as read")}>
                  Mark all read
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-[9px] hover:bg-[#FAFAFB] text-[12px] border-b border-[#F1F2F4] last:border-b-0">
                    <p className="text-[#030712] font-medium leading-snug">{n.text}</p>
                    <span className="text-[10.5px] text-[#6B7280]">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#F1F2F4] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#D5E3FC] text-[#155DFC] font-bold text-[12px] flex items-center justify-center border border-[#FFFFFF] shadow-xs">
              {user?.avatarInitials || "AV"}
            </div>
            <div className="hidden md:flex flex-col text-left min-w-0">
              <span className="text-[12.5px] font-semibold text-[#030712] leading-tight truncate">
                {user?.name || "Alex Vance"}
              </span>
              <span className="text-[10.5px] text-[#6B7280] leading-tight truncate">
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : user?.role === "client_admin"
                  ? "Client Admin"
                  : "Sales Rep"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] hidden md:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] shadow-card p-1.5 z-50 animate-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#E5E7EB] mb-1">
                <p className="text-[13px] font-bold text-[#030712] font-heading">{user?.name}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#FB3038] hover:bg-[#FB3038]/10 rounded-[9px] transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
