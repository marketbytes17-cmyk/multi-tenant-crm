"use client";

import React, { useState } from "react";
import { useClientReports } from "@/lib/hooks/useClient";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Download, Calendar } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ClientReportsPage() {
  const { toast } = useToast();
  const { data: reports, isLoading } = useClientReports();

  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-24");

  const handleExportCSV = () => {
    if (!reports?.repPerformance) return;

    let csvContent = "data:text/csv;charset=utf-8,Sales Rep Name,Leads Handled,Closed Won,Closed Lost,Conversion Rate (%)\n";
    reports.repPerformance.forEach((row) => {
      csvContent += `"${row.repName}",${row.leadsHandled},${row.closedWon},${row.closedLost},${row.conversionRate}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `client_organization_reports_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("Client organization CSV report exported!", "success");
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "repName",
      header: "Sales Representative",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#030712] text-[13.5px]">
          {row.original.repName}
        </span>
      ),
    },
    {
      accessorKey: "leadsHandled",
      header: "Leads Handled",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#155DFC] text-[13px]">
          {row.original.leadsHandled}
        </span>
      ),
    },
    {
      accessorKey: "closedWon",
      header: "Closed Won",
      cell: ({ row }) => (
        <span className="text-[#00BC7D] font-semibold text-[13px]">
          {row.original.closedWon}
        </span>
      ),
    },
    {
      accessorKey: "closedLost",
      header: "Closed Lost",
      cell: ({ row }) => (
        <span className="text-[#FB3038] font-semibold text-[13px]">
          {row.original.closedLost}
        </span>
      ),
    },
    {
      accessorKey: "conversionRate",
      header: "Conversion Rate",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-[#E3E7EF] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#00BC7D] h-full"
              style={{ width: `${Math.min(row.original.conversionRate, 100)}%` }}
            />
          </div>
          <span className="font-heading font-bold text-[12.5px] text-[#030712]">
            {row.original.conversionRate}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Organization Performance Reports
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Track Meta lead volume over time and team sales representative conversion metrics
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Date Range Picker Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <Calendar className="w-4 h-4 text-[#6B7280]" />
          <span className="font-heading font-semibold text-[#030712]">Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] px-2.5 py-1 text-[12.5px] font-medium"
            />
            <span className="text-[#6B7280]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] px-2.5 py-1 text-[12.5px] font-medium"
            />
          </div>
        </div>

        <span className="text-[12px] text-[#6B7280]">Showing org analytics</span>
      </div>

      {/* Line Chart: Performance Over Time */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card">
        <div className="mb-4">
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">
            Leads Received vs Deals Closed
          </h2>
          <p className="text-[12px] text-[#6B7280]">Daily volume trend line</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reports?.performanceOverTime || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* Rep Performance Table */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-[16px] text-[#030712]">Per-Rep Sales Performance</h2>
        <DataTable
          columns={columns}
          data={reports?.repPerformance || []}
          searchPlaceholder="Search sales reps..."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
