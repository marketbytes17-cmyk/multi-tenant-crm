"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClients, useDeactivateClientMutation } from "@/lib/hooks/useSuperAdmin";
import { DataTable } from "@/components/shared/DataTable";
import { ClientOrg } from "@/lib/types/superadmin";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Briefcase, ExternalLink, Power, Search, Filter } from "lucide-react";

export default function SuperAdminClientsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: clients = [], isLoading, isError, refetch } = useClients({ status: statusFilter });
  const deactivateMutation = useDeactivateClientMutation();

  const columns: ColumnDef<ClientOrg>[] = [
    {
      accessorKey: "name",
      header: "Client organization",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-[#D5E3FC] text-[#155DFC] font-bold text-[12px] flex items-center justify-center shrink-0">
            {row.original.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <Link
              href={`/superadmin/clients/${row.original.id}`}
              className="font-heading font-semibold text-[13.5px] text-[#030712] hover:text-[#155DFC] transition-colors"
            >
              {row.original.name}
            </Link>
            <p className="text-[11.5px] text-[#6B7280]">{row.original.adminEmail}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === "active";
        return (
          <div className="inline-flex items-center gap-1.5 font-medium text-[12px]">
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-[#00BC7D]" : "bg-[#6B7280]"}`} />
            <span className={isActive ? "text-[#00BC7D] font-semibold" : "text-[#6B7280]"}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "leadCount",
      header: "Total leads",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#030712] text-[13px]">
          {row.original.leadCount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "mappedPageCount",
      header: "Meta pages",
      cell: ({ row }) => (
        <span className="bg-[#F1F2F4] text-[#030712] text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full">
          {row.original.mappedPageCount} pages
        </span>
      ),
    },
    {
      accessorKey: "repCount",
      header: "Team reps",
      cell: ({ row }) => (
        <span className="text-[12.5px] text-[#6B7280]">{row.original.repCount} reps</span>
      ),
    },
    {
      accessorKey: "lastActivityDate",
      header: "Last activity",
      cell: ({ row }) => {
        const date = new Date(row.original.lastActivityDate);
        return (
          <span className="text-[12px] text-[#6B7280]">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/superadmin/clients/${row.original.id}`}
            className="p-1.5 text-[#6B7280] hover:text-[#155DFC] hover:bg-[#D5E3FC]/50 rounded-[7px] transition-colors"
            title="View Client Details"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={() => deactivateMutation.mutate(row.original.id)}
            className={`p-1.5 rounded-[7px] transition-colors ${
              row.original.status === "active"
                ? "text-[#6B7280] hover:text-[#FB3038] hover:bg-[#FB3038]/10"
                : "text-[#00BC7D] hover:bg-[#00BC7D]/10"
            }`}
            title={row.original.status === "active" ? "Deactivate Client" : "Reactivate Client"}
          >
            <Power className="w-4 h-4" />
          </button>
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
            Client Organizations
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Manage tenant client accounts, assigned Meta pages, and user access
          </p>
        </div>

        <Link
          href="/superadmin/clients/new"
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#FFFFFF] p-3 rounded-[14px] border border-[#E5E7EB] shadow-card">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6B7280]" />
          <span className="text-[12.5px] font-semibold text-[#030712] font-heading">Filter Status:</span>
          <div className="flex items-center gap-1">
            {["all", "active", "inactive"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-[11.5px] font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-[#030712] text-[#FFFFFF]"
                    : "bg-[#F1F2F4] text-[#6B7280] hover:text-[#030712]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[12px] text-[#6B7280]">{clients.length} total client orgs</span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={clients}
        searchPlaceholder="Search client orgs by name or admin email..."
        onRowClick={(row) => router.push(`/superadmin/clients/${row.id}`)}
        isLoading={isLoading}
      />
    </div>
  );
}
