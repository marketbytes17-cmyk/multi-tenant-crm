"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/shared/StatCard";
import { useSuperAdminDashboard } from "@/lib/hooks/useSuperAdmin";
import {
  GitMerge,
  Briefcase,
  Cpu,
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { data: summary, isLoading, isError, refetch } = useSuperAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#E3E7EF] rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-8 text-center shadow-card">
        <AlertTriangle className="w-8 h-8 text-[#FB3038] mx-auto mb-2" />
        <h3 className="font-heading font-bold text-[16px] text-[#030712]">Failed to load Super Admin dashboard</h3>
        <p className="text-[13px] text-[#6B7280] mb-4">Could not retrieve system summary telemetry.</p>
        <button
          onClick={() => refetch()}
          className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const isMetaDown = summary.systemStatus.metaConnection === "down";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            System telemetry, Meta webhook monitoring, and client organization oversight
          </p>
        </div>

        <Link
          href="/superadmin/clients/new"
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <Briefcase className="w-4 h-4" />
          <span>Add New Client</span>
        </Link>
      </div>

      {/* Meta Connection Alert Banner (if down) */}
      {isMetaDown && (
        <div className="bg-[#FB3038]/10 border border-[#FB3038]/30 rounded-[14px] p-4 flex items-center justify-between gap-3 text-[#FB3038]">
          <div className="flex items-center gap-2.5 text-[13px] font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Meta Webhook Integration Warning: Connection down or token expired</span>
          </div>
          <Link
            href="/superadmin/integration"
            className="text-[12px] font-bold underline hover:opacity-80 shrink-0"
          >
            Debug Integration &rarr;
          </Link>
        </div>
      )}

      {/* 4 Stat Cards Row with Rotating Tints per DESIGN_SYSTEM.md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Leads Processed (Month)"
          value={summary.totalLeadsMonth.toLocaleString()}
          icon={GitMerge}
          tint="blue"
          trend={{ value: `${summary.totalLeadsToday} today`, isPositive: true }}
          onAction={() => router.push("/superadmin/routing")}
        />

        <StatCard
          title="Active Client Orgs"
          value={summary.activeClientsCount.toString()}
          icon={Briefcase}
          tint="violet"
          actionLabel="Manage"
          onAction={() => router.push("/superadmin/clients")}
        />

        <StatCard
          title="Monthly Meta Ad Spend"
          value={`$${summary.totalAdSpendMonth.toLocaleString()}`}
          icon={TrendingUp}
          tint="orange"
          onAction={() => router.push("/superadmin/reports")}
        />

        <StatCard
          title="Meta System Health"
          value={isMetaDown ? "DOWN" : "HEALTHY"}
          icon={Cpu}
          tint={isMetaDown ? "orange" : "gray"}
          highlightAlert={isMetaDown}
          actionLabel="Status Logs"
          onAction={() => router.push("/superadmin/integration")}
        />
      </div>

      {/* Main Grid: Chart + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Panel (2 cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-[16px] text-[#030712]">
                Lead Ingestion Volume (Last 7 Days)
              </h2>
              <p className="text-[12px] text-[#6B7280]">Meta leadgen webhook triggers across all clients</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#00BC7D] bg-[#00BC7D]/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-Time Sync</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.leadsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#030712",
                    borderRadius: "9px",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#D5E3FC" }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#155DFC"
                  strokeWidth={2.5}
                  dot={{ fill: "#155DFC", r: 4 }}
                  activeDot={{ r: 6, stroke: "#D5E3FC", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed Panel (1 col) */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
            <h2 className="font-heading font-bold text-[16px] text-[#030712]">Recent Telemetry Feed</h2>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Live</span>
          </div>

          <div className="space-y-3.5 flex-1">
            {summary.recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-[12.5px] pb-3 border-b border-[#E5E7EB] last:border-b-0 last:pb-0">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    act.type === "lead"
                      ? "bg-[#155DFC]"
                      : act.type === "client"
                      ? "bg-[#7F71F8]"
                      : "bg-[#00BC7D]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-heading font-semibold text-[#030712] truncate">{act.clientName}</span>
                    <span className="text-[10.5px] text-[#6B7280] shrink-0">{act.timestamp}</span>
                  </div>
                  <p className="text-[#6B7280] leading-snug">{act.action}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/superadmin/integration"
            className="mt-4 text-center text-[12px] font-semibold text-[#155DFC] hover:underline flex items-center justify-center gap-1"
          >
            <span>View All Integration Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
