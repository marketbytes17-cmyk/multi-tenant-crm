"use client";

import React, { useState } from "react";
import { useSuperAdminReports } from "@/lib/hooks/useSuperAdmin";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Download, Calendar, Filter } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export default function SuperAdminReportsPage() {
  const { toast } = useToast();
  const { data: reports, isLoading } = useSuperAdminReports();

  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-24");

  const handleExportCSV = () => {
    if (!reports?.conversionByClient) return;

    let csvContent = "data:text/csv;charset=utf-8,Client Name,Total Leads,Closed Won,Closed Lost,Conversion Rate (%)\n";
    reports.conversionByClient.forEach((row) => {
      csvContent += `"${row.clientName}",${row.totalLeads},${row.closedWon},${row.closedLost},${row.conversionRate}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `superadmin_reports_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("Super Admin CSV report exported!", "success");
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "clientName",
      header: "Client Organization",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#030712] text-[13.5px]">
          {row.original.clientName}
        </span>
      ),
    },
    {
      accessorKey: "totalLeads",
      header: "Total Leads Received",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#155DFC] text-[13px]">
          {row.original.totalLeads}
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

  const BAR_COLORS = ["#155DFC", "#7F71F8", "#F54900", "#6B7280", "#00BC7D"];

  return (
    <div className="space-y-6">
      {/* Header & Date Picker Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            System-Wide Performance Reports
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Analyze lead volumes, client conversion rates, and comparative agency analytics
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

        <span className="text-[12px] text-[#6B7280]">Showing data for selected period</span>
      </div>

      {/* Bar Chart: Leads by Client */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card">
        <div className="mb-4">
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">
            Total Leads Distribution by Client Organization
          </h2>
          <p className="text-[12px] text-[#6B7280]">Comparative volume of Meta leads delivered</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reports?.leadsByClient || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="clientName" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
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
              <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                {(reports?.leadsByClient || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Rate Table */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-[16px] text-[#030712]">Client Conversion Summary</h2>
        <DataTable
          columns={columns}
          data={reports?.conversionByClient || []}
          searchPlaceholder="Search client conversion statistics..."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
