"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useUnassignedLeads,
  useClientTeam,
  useAssignLeadMutation,
  useBulkAssignLeadsMutation,
} from "@/lib/hooks/useClient";
import { DataTable } from "@/components/shared/DataTable";
import { StatusTag } from "@/components/shared/StatusTag";
import { DetailedLead } from "@/lib/types/client";
import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowLeft, UserCheck, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";

export default function UnassignedLeadsPage() {
  const { toast } = useToast();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkRepId, setBulkRepId] = useState("");

  const { data: unassignedLeads = [], isLoading } = useUnassignedLeads();
  const { data: team = [] } = useClientTeam();

  const assignMutation = useAssignLeadMutation();
  const bulkAssignMutation = useBulkAssignLeadsMutation();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(unassignedLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkAssign = async () => {
    if (selectedLeadIds.length === 0 || !bulkRepId) return;

    await bulkAssignMutation.mutateAsync({
      leadIds: selectedLeadIds,
      repId: bulkRepId,
    });

    setSelectedLeadIds([]);
    setBulkRepId("");
  };

  const columns: ColumnDef<DetailedLead>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={
            unassignedLeads.length > 0 && selectedLeadIds.length === unassignedLeads.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedLeadIds.includes(row.original.id)}
            onChange={() => handleToggleLead(row.original.id)}
            className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
          />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Unassigned Lead",
      cell: ({ row }) => (
        <div>
          <span className="font-heading font-semibold text-[13.5px] text-[#030712] block">
            {row.original.name}
          </span>
          <span className="text-[11.5px] text-[#6B7280]">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Stage",
      cell: ({ row }) => <StatusTag status={row.original.status} />,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="bg-[#F1F2F4] text-[#6B7280] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
          {row.original.source}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Received Date",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#6B7280]">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: "quickAssign",
      header: "Quick Assign Rep",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                assignMutation.mutate({ leadId: row.original.id, repId: e.target.value });
              }
            }}
            className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] text-[12px] p-1.5 focus:border-[#155DFC]"
          >
            <option value="" disabled>
              Select Rep...
            </option>
            {team.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/client/leads"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Leads
        </Link>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Priority Unassigned Leads
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Leads requiring immediate sales representative assignment
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-[#FFF1E6] border border-[#F54900]/30 rounded-[14px] p-4 text-[13px] text-[#F54900] flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>
          There are <strong>{unassignedLeads.length} unassigned leads</strong>. Assign them individually or select multiple leads for bulk assignment.
        </p>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="sticky top-16 z-30 bg-[#030712] text-[#FFFFFF] p-3.5 rounded-[14px] shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-[13px] font-semibold font-heading">
            <UserCheck className="w-5 h-5 text-[#D5E3FC]" />
            <span>{selectedLeadIds.length} leads selected for bulk assignment</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkRepId}
              onChange={(e) => setBulkRepId(e.target.value)}
              className="bg-[#FFFFFF] text-[#030712] border-0 rounded-[9px] text-[12.5px] p-2 font-medium"
            >
              <option value="" disabled>
                Select Target Sales Rep...
              </option>
              {team.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleExecuteBulkAssign}
              disabled={!bulkRepId || bulkAssignMutation.isPending}
              className="bg-[#155DFC] hover:bg-[#FFFFFF] hover:text-[#030712] text-[#FFFFFF] font-semibold text-[12.5px] px-4 py-2 rounded-full transition-colors disabled:opacity-50"
            >
              {bulkAssignMutation.isPending ? "Assigning..." : "Confirm Bulk Assign"}
            </button>
          </div>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={unassignedLeads}
        searchPlaceholder="Search unassigned leads..."
        isLoading={isLoading}
      />
    </div>
  );
}
