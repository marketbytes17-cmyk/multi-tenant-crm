"use client";

import React from "react";
import { useRepPerformance } from "@/lib/hooks/useRep";
import { StatCard } from "@/components/shared/StatCard";
import { Filter, CheckCircle2, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function RepPerformancePage() {
  const { data: perf, isLoading, isError, refetch } = useRepPerformance();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#E3E7EF] rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !perf) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-8 text-center shadow-card">
        <AlertTriangle className="w-8 h-8 text-[#FB3038] mx-auto mb-2" />
        <h3 className="font-heading font-bold text-[16px] text-[#030712]">Failed to load Performance Data</h3>
        <button
          onClick={() => refetch()}
          className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors mt-3"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          My Sales Performance
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Personal sales metrics, conversion efficiency, and response speed analysis
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Leads Handled Total"
          value={perf.leadsHandled.toString()}
          icon={Filter}
          tint="blue"
          trend={{ value: "All-time queue", isPositive: true }}
        />

        <StatCard
          title="Conversion Rate"
          value={`${perf.conversionRate}%`}
          icon={CheckCircle2}
          tint="violet"
          trend={{ value: `${perf.closedWonCount} deals closed won`, isPositive: true }}
        />

        <StatCard
          title="Avg Lead Response Time"
          value={`${perf.avgResponseTimeHours} hrs`}
          icon={Clock}
          tint="violet"
          trend={{ value: "Fast response target: <2h", isPositive: perf.avgResponseTimeHours < 2.0 }}
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card space-y-4">
        <div>
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">
            Daily Lead Velocity & Deals Won
          </h2>
          <p className="text-[12px] text-[#6B7280]">Leads assigned vs deals closed over past 7 days</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={perf.performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              />
              <Line type="monotone" dataKey="leadsReceived" stroke="#155DFC" strokeWidth={2.5} name="Leads Received" />
              <Line type="monotone" dataKey="closedWon" stroke="#00BC7D" strokeWidth={2.5} name="Closed Won" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
