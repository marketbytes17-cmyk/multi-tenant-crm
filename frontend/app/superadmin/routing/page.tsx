"use client";

import React, { useState } from "react";
import {
  useMetaMappings,
  useUnmatchedLeads,
  useClients,
  useCreateMappingMutation,
  useDeleteMappingMutation,
  useAssignUnmatchedLeadMutation,
} from "@/lib/hooks/useSuperAdmin";
import { DataTable } from "@/components/shared/DataTable";
import { MetaPageMapping, UnmatchedLead } from "@/lib/types/superadmin";
import { Modal } from "@/components/shared/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { GitMerge, AlertCircle, Plus, Trash2, CheckCircle2, ArrowRight } from "lucide-react";

export default function SuperAdminRoutingPage() {
  const [activeTab, setActiveTab] = useState<"mappings" | "unmatched">("mappings");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: mappings = [], isLoading: isLoadingMappings } = useMetaMappings();
  const { data: unmatchedLeads = [], isLoading: isLoadingUnmatched } = useUnmatchedLeads();
  const { data: clients = [] } = useClients({ status: "active" });

  const createMappingMutation = useCreateMappingMutation();
  const deleteMappingMutation = useDeleteMappingMutation();
  const assignUnmatchedMutation = useAssignUnmatchedLeadMutation();

  const [newMappingData, setNewMappingData] = useState({
    pageId: "",
    pageName: "",
    adId: "",
    clientId: "",
  });

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMappingMutation.mutateAsync(newMappingData);
    setIsAddModalOpen(false);
    setNewMappingData({ pageId: "", pageName: "", adId: "", clientId: "" });
  };

  const mappingColumns: ColumnDef<MetaPageMapping>[] = [
    {
      accessorKey: "pageName",
      header: "Meta Page Name",
      cell: ({ row }) => (
        <div>
          <span className="font-heading font-semibold text-[13.5px] text-[#030712]">
            {row.original.pageName}
          </span>
          <p className="text-[11.5px] text-[#6B7280] font-mono">ID: {row.original.pageId}</p>
        </div>
      ),
    },
    {
      accessorKey: "clientName",
      header: "Mapped Client Org",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#155DFC] text-[13px] bg-[#D5E3FC]/40 px-2.5 py-1 rounded-full">
          {row.original.clientName}
        </span>
      ),
    },
    {
      accessorKey: "adId",
      header: "Ad Campaign ID",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#6B7280] font-mono">
          {row.original.adId || "All Ads for Page"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Mapped",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#6B7280]">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => deleteMappingMutation.mutate(row.original.id)}
          className="p-1.5 text-[#6B7280] hover:text-[#FB3038] hover:bg-[#FB3038]/10 rounded-[7px] transition-colors"
          title="Delete Mapping"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

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
      header: "Manual Assign to Client",
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Lead Routing & Meta Page Mapping
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Direct Meta leadgen webhook events to the correct client organization
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Page Mapping</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-6">
        <button
          onClick={() => setActiveTab("mappings")}
          className={`pb-3 flex items-center gap-2 text-[13.5px] font-semibold border-b-2 transition-colors font-heading ${
            activeTab === "mappings"
              ? "border-[#155DFC] text-[#155DFC]"
              : "border-transparent text-[#6B7280] hover:text-[#030712]"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          <span>Active Mapped Pages ({mappings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("unmatched")}
          className={`pb-3 flex items-center gap-2 text-[13.5px] font-semibold border-b-2 transition-colors font-heading ${
            activeTab === "unmatched"
              ? "border-[#155DFC] text-[#155DFC]"
              : "border-transparent text-[#6B7280] hover:text-[#030712]"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-[#F54900]" />
          <span>Unmatched Inbox ({unmatchedLeads.length})</span>
          {unmatchedLeads.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#F54900] animate-ping" />
          )}
        </button>
      </div>

      {/* Tab View */}
      {activeTab === "mappings" ? (
        <DataTable
          columns={mappingColumns}
          data={mappings}
          searchPlaceholder="Search mappings by Page ID or Client Name..."
          isLoading={isLoadingMappings}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-[#FFF1E6] border border-[#F54900]/30 rounded-[14px] p-4 text-[13px] text-[#F54900] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              These leads arrived via webhook but their <strong>Page ID</strong> wasn't mapped to any active client organization. Manually assign them below to transfer them to the client's inbox.
            </p>
          </div>
          <DataTable
            columns={unmatchedColumns}
            data={unmatchedLeads}
            searchPlaceholder="Search unmatched leads by name..."
            isLoading={isLoadingUnmatched}
          />
        </div>
      )}

      {/* Add Mapping Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Meta Page Mapping"
        description="Link a Facebook/Instagram Page ID to a target client organization"
      >
        <form onSubmit={handleAddMapping} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Meta Page ID *
            </label>
            <input
              type="text"
              value={newMappingData.pageId}
              onChange={(e) => setNewMappingData({ ...newMappingData, pageId: e.target.value })}
              placeholder="e.g. 109823471092834"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Page Name Label *
            </label>
            <input
              type="text"
              value={newMappingData.pageName}
              onChange={(e) => setNewMappingData({ ...newMappingData, pageName: e.target.value })}
              placeholder="e.g. Apex Design Official Page"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Specific Ad ID (Optional)
            </label>
            <input
              type="text"
              value={newMappingData.adId}
              onChange={(e) => setNewMappingData({ ...newMappingData, adId: e.target.value })}
              placeholder="e.g. ad_9823471 (leave blank for all page ads)"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] font-mono"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Target Client Organization *
            </label>
            <select
              value={newMappingData.clientId}
              onChange={(e) => setNewMappingData({ ...newMappingData, clientId: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
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

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-[13px] text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMappingMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
            >
              {createMappingMutation.isPending ? "Creating..." : "Save Mapping"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
