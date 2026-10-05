"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { useCreateLeadMutation } from "@/lib/hooks/useClient";
import { Modal } from "@/components/shared/Modal";
import { Bell, LogOut, Shield, User, ChevronDown, Plus, Check, Trash2, Mail, Phone, Tag } from "lucide-react";

export function TopBar() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const createLeadMutation = useCreateLeadMutation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "Manual Direct Entry",
    notes: "",
  });

  const [notifications, setNotifications] = useState([
    { id: 1, text: "New lead arrived from Meta Ad Campaign", time: "Just now", type: "new", read: false },
    { id: 2, text: "Sarah assigned 3 unassigned leads to you", time: "1h ago", type: "assign", read: false },
    { id: 3, text: "Meta webhook System Token health verified", time: "3h ago", type: "system", read: false },
  ]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setHasUnread(false);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setHasUnread(false);
    toast("All notifications marked as read", "success");
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
    toast("Notification feed cleared", "info");
  };

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name.trim() || !newLeadForm.phone.trim()) {
      toast("Name and phone number are required.", "error");
      return;
    }
    await createLeadMutation.mutateAsync(newLeadForm);
    setIsAddLeadModalOpen(false);
    setNewLeadForm({ name: "", phone: "", email: "", source: "Manual Direct Entry", notes: "" });
  };

  return (
    <>
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
              onClick={() => setIsAddLeadModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-[#030712] text-[#FFFFFF] hover:bg-[#155DFC] text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="w-8 h-8 rounded-full bg-[#F1F2F4] flex items-center justify-center text-[#6B7280] hover:text-[#030712] hover:bg-[#E3E7EF] transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && notifications.some((n) => !n.read) && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#FB3038] ring-1.5 ring-[#FFFFFF]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] shadow-card p-3 z-50 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-2">
                  <h4 className="font-heading font-bold text-[13px] text-[#030712]">Notifications</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-[#155DFC] font-medium hover:underline"
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      className="text-[11px] text-[#6B7280] font-medium hover:text-[#FB3038]"
                      onClick={handleClearNotifications}
                      title="Clear notifications"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[12px] text-[#6B7280] text-center py-4 italic">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 rounded-[9px] text-[12px] border-b border-[#F1F2F4] last:border-b-0 transition-colors ${
                          n.read ? "opacity-60 bg-transparent" : "bg-[#FAFAFB]"
                        }`}
                      >
                        <p className="text-[#030712] font-medium leading-snug">{n.text}</p>
                        <span className="text-[10.5px] text-[#6B7280]">{n.time}</span>
                      </div>
                    ))
                  )}
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

      {/* Real Add Lead Modal */}
      <Modal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        title="Add New Lead"
        description="Manually record a walk-in, inbound phone call, or external referral lead."
      >
        <form onSubmit={handleAddLeadSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Contact Full Name *
            </label>
            <input
              type="text"
              value={newLeadForm.name}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] focus:border-[#155DFC]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
                Phone Number *
              </label>
              <input
                type="text"
                value={newLeadForm.phone}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] focus:border-[#155DFC]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
                Email Address
              </label>
              <input
                type="email"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] focus:border-[#155DFC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Campaign / Referral Source
            </label>
            <input
              type="text"
              value={newLeadForm.source}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
              placeholder="e.g. Inbound Direct Call / Meta Ad"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] focus:border-[#155DFC]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Initial Notes / Inquiry Details
            </label>
            <textarea
              rows={2}
              value={newLeadForm.notes}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
              placeholder="Interested in enterprise tier package..."
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] focus:border-[#155DFC]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(false)}
              className="px-4 py-2 text-[13px] text-[#6B7280] hover:text-[#030712]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLeadMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-[#155DFC] transition-colors disabled:opacity-50"
            >
              {createLeadMutation.isPending ? "Adding..." : "Add to Leads Inbox"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

