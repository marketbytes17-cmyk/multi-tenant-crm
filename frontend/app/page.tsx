"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else {
        switch (user.role) {
          case "super_admin":
            router.push("/superadmin");
            break;
          case "client_admin":
            router.push("/client");
            break;
          case "sales_rep":
            router.push("/rep");
            break;
          default:
            router.push("/login");
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#E3E7EF] flex items-center justify-center p-4 font-sans">
      <div className="flex items-center gap-3 bg-[#FFFFFF] px-5 py-3.5 rounded-[14px] border border-[#E5E7EB] shadow-card">
        <div className="w-5 h-5 border-2 border-[#155DFC] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13.5px] font-semibold text-[#030712] font-heading">
          Loading MarketBytes CRM...
        </span>
      </div>
    </div>
  );
}
