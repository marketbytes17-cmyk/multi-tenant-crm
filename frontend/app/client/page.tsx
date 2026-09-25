"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/shared/StatCard";
import { useClientDashboard } from "@/lib/hooks/useClient";
import {
  Filter,
  Users,
  Kanban,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

export default function ClientDashboardPage() {
  const router = useRouter();
  const { data: summary, isLoading, isError, refetch } = useClientDashboard();

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
        <h3 className="font-heading font-bold text-[16px] text-[#030712]">Failed to load Client Dashboard</h3>
        <p className="text-[13px] text-[#6B7280] mb-4">Could not retrieve dashboard metrics.</p>
        <button
          onClick={() => refetch()}
          className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const hasUnassignedAlert = summary.unassignedCount > 0;

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Client Workspace Dashboard
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Real-time Meta lead reception, team assignment status, and pipeline snapshot
          </p>
        </div>

        <Link
          href="/client/leads/unassigned"
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <Filter className="w-4 h-4 text-[#D5E3FC]" />
          <span>Assign Unassigned Leads ({summary.unassignedCount})</span>
        </Link>
      </div>

      {/* 4 Stat Cards Row with Rotating Tints per DESIGN_SYSTEM.md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Leads Today"
          value={summary.newLeadsToday.toString()}
          icon={Filter}
          tint="blue"
          trend={{ value: "Real-time sync", isPositive: true }}
          actionLabel="View All"
          onAction={() => router.push("/client/leads")}
        />

        <StatCard
          title="Unassigned Leads Priority"
          value={summary.unassignedCount.toString()}
          icon={AlertTriangle}
          tint="orange"
          highlightAlert={hasUnassignedAlert}
          actionLabel="Assign"
          onAction={() => router.push("/client/leads/unassigned")}
        />

        <StatCard
          title="Active Pipeline Value"
          value={`$${summary.pipelineActiveValue.toLocaleString()}`}
          icon={Kanban}
          tint="violet"
          actionLabel="Pipeline"
          onAction={() => router.push("/client/pipeline")}
        />

        <StatCard
          title="Active Team Sales Reps"
          value={summary.activeRepsCount.toString()}
          icon={Users}
          tint="gray"
          actionLabel="Team"
          onAction={() => router.push("/client/team")}
        />
      </div>

      {/* Main Grid: Pipeline Stage Snapshot + Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel Snapshot (2 cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="font-heading font-bold text-[16px] text-[#030712]">
                Pipeline Stage Breakdown
              </h2>
              <p className="text-[12px] text-[#6B7280]">Distribution of active leads across sales stages</p>
            </div>
            <Link
              href="/client/pipeline"
              className="text-[12.5px] font-semibold text-[#155DFC] hover:underline flex items-center gap-1"
            >
              <span>Open Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summary.stageFunnel.map((item) => (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-heading font-semibold text-[#030712]">{item.stage}</span>
                  <span className="font-bold text-[#030712]">{item.count} leads</span>
                </div>
                <div className="w-full bg-[#F1F2F4] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.stage === "New"
                        ? "bg-[#155DFC]"
                        : item.stage === "Contacted"
                        ? "bg-[#F54900]"
                        : item.stage === "In Negotiation"
                        ? "bg-[#7F71F8]"
                        : item.stage === "Closed Won"
                        ? "bg-[#00BC7D]"
                        : "bg-[#FB3038]"
                    }`}
                    style={{ width: `${Math.max(item.count * 15, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity Panel (1 col) */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
              <h2 className="font-heading font-bold text-[16px] text-[#030712]">Team Lead Capacity</h2>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Reps</span>
            </div>

            <div className="space-y-3">
              {summary.teamActivity.map((rep) => (
                <div key={rep.repId} className="flex items-center justify-between text-[12.5px] pb-2 border-b border-[#E5E7EB] last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#D5E3FC] text-[#155DFC] font-bold text-[10.5px] flex items-center justify-center">
                      {rep.repInitials}
                    </div>
                    <div>
                      <span className="font-heading font-semibold text-[#030712] block">{rep.repName}</span>
                      <span className="text-[11px] text-[#6B7280]">{rep.leadsHandled} leads assigned</span>
                    </div>
                  </div>
                  <span className="text-[11.5px] font-bold text-[#00BC7D]">
                    {rep.conversionRate}% conv.
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/client/team"
            className="mt-4 text-center text-[12px] font-semibold text-[#155DFC] hover:underline flex items-center justify-center gap-1"
          >
            <span>Manage Team Representatives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
