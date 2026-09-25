"use client";

import React from "react";
import Link from "next/link";
import { useUnmatchedLeads, useClients, useAssignUnmatchedLeadMutation } from "@/lib/hooks/useSuperAdmin";
import { DataTable } from "@/components/shared/DataTable";
import { UnmatchedLead } from "@/lib/types/superadmin";
import { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, ArrowLeft, GitMerge } from "lucide-react";

export default function SuperAdminUnmatchedLeadsPage() {
  const { data: unmatchedLeads = [], isLoading } = useUnmatchedLeads();
  const { data: clients = [] } = useClients({ status: "active" });
  const assignUnmatchedMutation = useAssignUnmatchedLeadMutation();

  const unmatchedColumns: ColumnDef<UnmatchedLead>[] = [
    {
      accessorKey: "leadName",
      header: "Lead Contact",
      cell: ({ row }) => (
        <div>
          <span className="font-heading font-semibold text-[13.5px] text-[#030712]">
            {row.original.leadName}
          </span>
          <p className="text-[11.5px] text-[#6B7280]">{row.original.leadPhone}</p>
        </div>
      ),
    },
    {
      accessorKey: "rawPageId",
      header: "Unmatched Page ID",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-[#FB3038] bg-[#FB3038]/10 px-2.5 py-0.5 rounded-full font-semibold">
          {row.original.rawPageId}
        </span>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Received At",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#6B7280]">
          {new Date(row.original.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      id: "assignAction",
      header: "Manually Assign to Client",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                assignUnmatchedMutation.mutate({
                  leadId: row.original.id,
                  clientId: e.target.value,
                });
              }
            }}
            className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] text-[12px] p-1.5 focus:border-[#155DFC]"
          >
            <option value="" disabled>
              Select Client Org...
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/superadmin/routing"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meta Mappings
        </Link>

        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Unmatched Webhook Leads Inbox
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Incoming leads with Page IDs not currently mapped to any client organization
        </p>
      </div>

      <div className="bg-[#FFF1E6] border border-[#F54900]/30 rounded-[14px] p-4 text-[13px] text-[#F54900] flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>
          Assign an unmatched lead to a client organization below. Once assigned, it will automatically transfer into the client's main Leads Inbox.
        </p>
      </div>

      <DataTable
        columns={unmatchedColumns}
        data={unmatchedLeads}
        searchPlaceholder="Search unmatched leads..."
        isLoading={isLoading}
      />
    </div>
  );
}
