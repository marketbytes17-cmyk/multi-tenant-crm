"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, UserRole } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("client_admin");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, selectedRole);
      toast("Welcome back to MarketBytes CRM!", "success");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      setIsSubmitting(false);
    }
  };

  const setDemoAccount = (demoEmail: string, role: UserRole) => {
    setEmail(demoEmail);
    setPassword("password123");
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E3E7EF] p-4 font-sans">
      <div className="w-full max-w-4xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] shadow-[0_1px_2px_rgba(3,7,18,0.04),0_8px_20px_rgba(3,7,18,0.06)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Panel: Brand Accent */}
        <div className="bg-[#030712] p-8 md:p-10 text-[#FFFFFF] flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-[10px] bg-[#155DFC] flex items-center justify-center font-heading font-bold text-white text-[18px]">
                M
              </div>
              <span className="font-heading font-extrabold text-[20px] text-[#FFFFFF] tracking-tight">
                MarketBytes CRM
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-[26px] md:text-[30px] leading-tight text-[#FFFFFF] mb-3">
              Precision lead management for growth agencies.
            </h1>
            <p className="text-[13.5px] text-[#9A9AA2] leading-relaxed">
              Capture Meta leads instantly, route seamlessly to your team, and track conversions in one clean interface.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-[#2B2B2F] mt-8">
            <div className="flex items-center gap-2 text-[12px] text-[#D5E3FC]">
              <ShieldCheck className="w-4 h-4 text-[#155DFC]" />
              <span>Role-Based Access Control & Instant Sync</span>
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#155DFC]/20 blur-3xl pointer-events-none" />
        </div>

        {/* Right Panel: Login Form */}
        <div className="p-8 md:p-10 bg-[#FFFFFF] flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-heading font-bold text-[22px] text-[#030712]">Sign In</h2>
            <p className="text-[13px] text-[#6B7280] mt-1">Enter your account credentials to access your portal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[9px] bg-[#FB3038]/10 border border-[#FB3038]/30 text-[#FB3038] text-[12.5px] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[12px] font-semibold text-[#030712] font-heading">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-[#155DFC] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Target Role (Demo Simulator)
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F2F4] rounded-[9px]">
                <button
                  type="button"
                  onClick={() => setSelectedRole("super_admin")}
                  className={`py-1.5 text-[11.5px] font-semibold rounded-[7px] transition-all ${
                    selectedRole === "super_admin"
                      ? "bg-[#FFFFFF] text-[#155DFC] shadow-xs"
                      : "text-[#6B7280] hover:text-[#030712]"
                  }`}
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("client_admin")}
                  className={`py-1.5 text-[11.5px] font-semibold rounded-[7px] transition-all ${
                    selectedRole === "client_admin"
                      ? "bg-[#FFFFFF] text-[#155DFC] shadow-xs"
                      : "text-[#6B7280] hover:text-[#030712]"
                  }`}
                >
                  Client Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("sales_rep")}
                  className={`py-1.5 text-[11.5px] font-semibold rounded-[7px] transition-all ${
                    selectedRole === "sales_rep"
                      ? "bg-[#FFFFFF] text-[#155DFC] shadow-xs"
                      : "text-[#6B7280] hover:text-[#030712]"
                  }`}
                >
                  Sales Rep
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13.5px] py-2.5 rounded-full hover:bg-[#030712] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign In to Portal"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
              Quick Demo Login:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDemoAccount("admin@marketbytes.io", "super_admin")}
                className="text-[11px] bg-[#EEECFE] text-[#7F71F8] px-2.5 py-1 rounded-full font-medium hover:opacity-80"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("sarah@apexdesign.com", "client_admin")}
                className="text-[11px] bg-[#D5E3FC] text-[#155DFC] px-2.5 py-1 rounded-full font-medium hover:opacity-80"
              >
                Client Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("michael@apexdesign.com", "sales_rep")}
                className="text-[11px] bg-[#FFF1E6] text-[#F54900] px-2.5 py-1 rounded-full font-medium hover:opacity-80"
              >
                Sales Rep
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
