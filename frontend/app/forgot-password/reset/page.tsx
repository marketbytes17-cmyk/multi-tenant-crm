"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast("Password reset successfully!", "success");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E3E7EF] p-4 font-sans">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-8 shadow-[0_1px_2px_rgba(3,7,18,0.04),0_8px_20px_rgba(3,7,18,0.06)]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#00BC7D]/10 text-[#00BC7D] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-[20px] text-[#030712] mb-2">Password Reset Complete</h2>
            <p className="text-[13px] text-[#6B7280] leading-relaxed mb-6">
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-[#155DFC] text-[#FFFFFF] text-[13.5px] font-semibold py-2.5 rounded-full hover:bg-[#030712] transition-colors"
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <div>
            <h2 className="font-heading font-bold text-[22px] text-[#030712] mb-1">Set New Password</h2>
            <p className="text-[13px] text-[#6B7280] mb-6">
              Please enter and confirm your new account password below.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-[9px] bg-[#FB3038]/10 border border-[#FB3038]/30 text-[#FB3038] text-[12.5px] font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13.5px] py-2.5 rounded-full hover:bg-[#030712] transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Updating password..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
