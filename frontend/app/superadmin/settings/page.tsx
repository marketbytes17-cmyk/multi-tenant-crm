"use client";

import React, { useState } from "react";
import { useToast } from "@/lib/context/ToastContext";
import { SuperAdminSettingsSchema } from "@/lib/validators/superadmin";
import { ChangePasswordSchema } from "@/lib/validators/auth";
import { Settings, Shield, Mail, Lock, Check } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const { toast } = useToast();

  const [platformSettings, setPlatformSettings] = useState({
    platformName: "MarketBytes CRM",
    supportEmail: "support@marketbytes.io",
    webhookRetryLimit: 3,
    defaultNotificationEmail: "alerts@marketbytes.io",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      toast("Platform settings updated successfully!", "success");
    }, 400);
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
      toast("Super Admin password updated successfully!", "success");
    }, 400);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Super Admin Settings
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Manage global platform parameters, default alert thresholds, and security
        </p>
      </div>

      {/* Platform Info Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
          <Settings className="w-5 h-5 text-[#155DFC]" />
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">Platform Configuration</h2>
        </div>

        <form onSubmit={handleSavePlatformSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Platform Name
              </label>
              <input
                type="text"
                value={platformSettings.platformName}
                onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Support Contact Email
              </label>
              <input
                type="email"
                value={platformSettings.supportEmail}
                onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Webhook Retry Limit
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={platformSettings.webhookRetryLimit}
                onChange={(e) => setPlatformSettings({ ...platformSettings, webhookRetryLimit: parseInt(e.target.value) || 3 })}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Default Alert Notification Email
              </label>
              <input
                type="email"
                value={platformSettings.defaultNotificationEmail}
                onChange={(e) => setPlatformSettings({ ...platformSettings, defaultNotificationEmail: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
            >
              {isSavingSettings ? "Saving..." : "Save Platform Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
          <Shield className="w-5 h-5 text-[#7F71F8]" />
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">Change Super Admin Password</h2>
        </div>

        {passwordError && (
          <div className="p-3 rounded-[9px] bg-[#FB3038]/10 text-[#FB3038] text-[12.5px] font-medium">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
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
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
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
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
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
