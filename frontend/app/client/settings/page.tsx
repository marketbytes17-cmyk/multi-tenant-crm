"use client";

import React, { useState } from "react";
import { useUpdateClientSettingsMutation } from "@/lib/hooks/useClient";
import { ClientSettingsSchema } from "@/lib/validators/client";
import { ChangePasswordSchema } from "@/lib/validators/auth";
import { useToast } from "@/lib/context/ToastContext";
import { Settings, Shield, Bell, Building2, Upload, Check } from "lucide-react";

export default function ClientSettingsPage() {
  const { toast } = useToast();
  const updateSettingsMutation = useUpdateClientSettingsMutation();

  const [settingsData, setSettingsData] = useState({
    orgName: "Apex Design Co.",
    notifyOnNewLead: true,
    dailySummaryDigest: true,
    leadAssignmentMode: "manual" as "manual" | "round_robin",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast("Logo file size must be less than 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast("Logo preview updated!", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = ClientSettingsSchema.safeParse(settingsData);
    if (!validation.success) {
      toast("Please check org settings fields", "error");
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
      toast("Your admin password has been updated!", "success");
    }, 400);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Organization Settings
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Manage org branding, automated lead assignment preferences, notifications, and security
        </p>
      </div>

      {/* Org Profile & Branding Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
          <Building2 className="w-5 h-5 text-[#155DFC]" />
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">Organization Profile & Branding</h2>
        </div>

        <form onSubmit={handleSaveOrgSettings} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Organization Name
            </label>
            <input
              type="text"
              value={settingsData.orgName}
              onChange={(e) => setSettingsData({ ...settingsData, orgName: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Organization Logo Upload
            </label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[11px] bg-[#F1F2F4] border border-[#E5E7EB] flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-[#6B7280]" />
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  id="logoUpload"
                  accept="image/png, image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logoUpload"
                  className="inline-flex items-center gap-1.5 bg-[#F1F2F4] hover:bg-[#E3E7EF] text-[#030712] font-semibold text-[12.5px] px-3.5 py-2 rounded-full cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Brand Logo (PNG/JPG &lt; 2MB)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Lead Assignment Mode */}
          <div className="pt-2 border-t border-[#E5E7EB]">
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Lead Assignment Protocol
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-[11px] border cursor-pointer flex items-start gap-3 transition-colors ${
                  settingsData.leadAssignmentMode === "manual"
                    ? "border-[#155DFC] bg-[#D5E3FC]/20"
                    : "border-[#E5E7EB] bg-[#FAFAFB]"
                }`}
              >
                <input
                  type="radio"
                  name="assignmentMode"
                  value="manual"
                  checked={settingsData.leadAssignmentMode === "manual"}
                  onChange={() => setSettingsData({ ...settingsData, leadAssignmentMode: "manual" })}
                  className="mt-0.5 text-[#155DFC]"
                />
                <div>
                  <span className="font-heading font-bold text-[13px] text-[#030712] block">
                    Manual Assignment
                  </span>
                  <span className="text-[11.5px] text-[#6B7280]">
                    Leads enter Unassigned Inbox for admin or rep assignment.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-[11px] border cursor-pointer flex items-start gap-3 transition-colors ${
                  settingsData.leadAssignmentMode === "round_robin"
                    ? "border-[#155DFC] bg-[#D5E3FC]/20"
                    : "border-[#E5E7EB] bg-[#FAFAFB]"
                }`}
              >
                <input
                  type="radio"
                  name="assignmentMode"
                  value="round_robin"
                  checked={settingsData.leadAssignmentMode === "round_robin"}
                  onChange={() => setSettingsData({ ...settingsData, leadAssignmentMode: "round_robin" })}
                  className="mt-0.5 text-[#155DFC]"
                />
                <div>
                  <span className="font-heading font-bold text-[13px] text-[#030712] block">
                    Round-Robin Auto Assign
                  </span>
                  <span className="text-[11.5px] text-[#6B7280]">
                    Automatically cycle incoming Meta leads across active reps.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="pt-2 border-t border-[#E5E7EB] space-y-3">
            <h3 className="font-heading font-bold text-[14px] text-[#030712]">Notification Preferences</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer text-[13px] text-[#030712]">
                <input
                  type="checkbox"
                  checked={settingsData.notifyOnNewLead}
                  onChange={(e) => setSettingsData({ ...settingsData, notifyOnNewLead: e.target.checked })}
                  className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
                />
                <span>Instant email notification on new Meta lead reception</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-[13px] text-[#030712]">
                <input
                  type="checkbox"
                  checked={settingsData.dailySummaryDigest}
                  onChange={(e) => setSettingsData({ ...settingsData, dailySummaryDigest: e.target.checked })}
                  className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
                />
                <span>Receive daily evening summary digest of team conversions</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Organization Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
          <Shield className="w-5 h-5 text-[#7F71F8]" />
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">Change Admin Password</h2>
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
