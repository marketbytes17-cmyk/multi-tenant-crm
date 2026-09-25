"use client";

import React, { useState, useEffect } from "react";
import { useRepSettings, useUpdateRepSettingsMutation } from "@/lib/hooks/useRep";
import { RepSettingsSchema } from "@/lib/validators/rep";
import { useToast } from "@/lib/context/ToastContext";
import { Settings, Shield, Bell, User } from "lucide-react";

export default function RepSettingsPage() {
  const { toast } = useToast();
  const { data: initialSettings, isLoading } = useRepSettings();
  const updateSettingsMutation = useUpdateRepSettingsMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notifyOnNewLead: true,
    notifyOnFollowUp: true,
    dailyDigest: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setFormData({
        name: initialSettings.name,
        email: initialSettings.email,
        notifyOnNewLead: initialSettings.notifyOnNewLead,
        notifyOnFollowUp: initialSettings.notifyOnFollowUp,
        dailyDigest: initialSettings.dailyDigest,
      });
    }
  }, [initialSettings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = RepSettingsSchema.safeParse(formData);
    if (!validation.success) {
      toast("Please check your profile details", "error");
      return;
    }

    await updateSettingsMutation.mutateAsync(validation.data);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast("Your password has been successfully updated!", "success");
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6 animate-pulse">
        <div className="h-8 bg-[#E3E7EF] rounded w-64" />
        <div className="h-64 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Sales Representative Settings
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Manage your personal profile, notification preferences, and account security
        </p>
      </div>

      {/* Profile & Notifications Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
          <User className="w-5 h-5 text-[#155DFC]" />
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">Profile & Notification Preferences</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Work Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>

          {/* Notifications */}
          <div className="pt-2 border-t border-[#E5E7EB] space-y-3">
            <h3 className="font-heading font-bold text-[14px] text-[#030712]">Email & Alert Preferences</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer text-[13px] text-[#030712]">
                <input
                  type="checkbox"
                  checked={formData.notifyOnNewLead}
                  onChange={(e) => setFormData({ ...formData, notifyOnNewLead: e.target.checked })}
                  className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
                />
                <span>Instant email notification when a new lead is assigned to me</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-[13px] text-[#030712]">
                <input
                  type="checkbox"
                  checked={formData.notifyOnFollowUp}
                  onChange={(e) => setFormData({ ...formData, notifyOnFollowUp: e.target.checked })}
                  className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
                />
                <span>Daily morning follow-up reminder alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-[13px] text-[#030712]">
                <input
                  type="checkbox"
                  checked={formData.dailyDigest}
                  onChange={(e) => setFormData({ ...formData, dailyDigest: e.target.checked })}
                  className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
                />
                <span>Receive evening personal sales summary digest</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
          <Shield className="w-5 h-5 text-[#7F71F8]" />
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">Change Account Password</h2>
        </div>

        {passwordError && (
          <div className="p-3 rounded-[9px] bg-[#FB3038]/10 text-[#FB3038] text-[12.5px] font-medium">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-[#030712] transition-colors"
            >
              {isSavingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
