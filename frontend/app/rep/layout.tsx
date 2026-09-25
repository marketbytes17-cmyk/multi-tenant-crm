"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shared/AppShell";

export default function SalesRepLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "sales_rep") {
        if (user.role === "super_admin") router.push("/superadmin");
        else if (user.role === "client_admin") router.push("/client");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "sales_rep") {
    return (
      <div className="min-h-screen bg-[#E3E7EF] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-[#FFFFFF] px-5 py-3 rounded-[14px] border border-[#E5E7EB] shadow-card">
          <div className="w-5 h-5 border-2 border-[#155DFC] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold text-[#030712] font-heading">
            Authenticating Sales Rep Portal...
          </span>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
