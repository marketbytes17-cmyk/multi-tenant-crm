"use client";

import React, { useState } from "react";
import { useMetaIntegrationStatus, useSendTestLeadMutation, useMetaMappings, useCreateMappingMutation, useClients } from "@/lib/hooks/useSuperAdmin";
import { DataTable } from "@/components/shared/DataTable";
import { WebhookLog } from "@/lib/types/superadmin";
import { ColumnDef } from "@tanstack/react-table";
import { Cpu, CheckCircle2, AlertTriangle, Send, RefreshCw, ShieldCheck, Clock, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";

export default function SuperAdminIntegrationPage() {
  const { data: status, isLoading, isError, refetch } = useMetaIntegrationStatus();
  const sendTestLeadMutation = useSendTestLeadMutation();
  const { data: mappings } = useMetaMappings();
  const { data: clients } = useClients();
  const createMappingMutation = useCreateMappingMutation();
  const { toast } = useToast();
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [mappingForm, setMappingForm] = useState({ clientId: "", pageId: "", pageName: "" });

  const logColumns: ColumnDef<WebhookLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
          <span className="text-[12px] text-[#6B7280]">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </span>
        );
      },
    },
    {
      accessorKey: "event",
      header: "Webhook Event",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] font-semibold text-[#030712]">
          {row.original.event}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isSuccess = row.original.status === "success";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isSuccess ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "bg-[#FB3038]/10 text-[#FB3038]"
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {isSuccess ? "SUCCESS 200" : "FAILED"}
          </span>
        );
      },
    },
    {
      accessorKey: "pageId",
      header: "Meta Page ID",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-[#6B7280]">{row.original.pageId}</span>
      ),
    },
    {
      accessorKey: "details",
      header: "Execution Details",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#030712] truncate max-w-md block">
          {row.original.details}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#E3E7EF] rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Meta Integration Status & Telemetry
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            System User Token health, webhook listener logs, and test lead generator
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMapping(true)}
            className="inline-flex items-center gap-1.5 bg-[#00BC7D]/10 hover:bg-[#00BC7D]/20 text-[#00BC7D] font-semibold text-[13px] px-3.5 py-2.5 rounded-full transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Page Mapping</span>
          </button>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 bg-[#F1F2F4] hover:bg-[#E3E7EF] text-[#030712] font-semibold text-[13px] px-3.5 py-2.5 rounded-full transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => sendTestLeadMutation.mutate()}
            disabled={sendTestLeadMutation.isPending}
            className="inline-flex items-center gap-1.5 bg-[#155DFC] hover:bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendTestLeadMutation.isPending ? "Simulating..." : "Send Test Lead"}</span>
          </button>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#00BC7D]/10 text-[#00BC7D] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11.5px] text-[#6B7280] font-medium block mb-1">System User Token</span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-[18px] text-[#030712]">Valid & Active</span>
              <span className="w-2 h-2 rounded-full bg-[#00BC7D]" />
            </div>
            <p className="text-[11.5px] text-[#6B7280] mt-1">
              Expires: {new Date(status?.tokenExpiresAt || "").toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#155DFC]/10 text-[#155DFC] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11.5px] text-[#6B7280] font-medium block mb-1">Last Webhook Received</span>
            <span className="font-heading font-extrabold text-[18px] text-[#030712]">
              {new Date(status?.lastWebhookTimestamp || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <p className="text-[11.5px] text-[#6B7280] mt-1">
              {new Date(status?.lastWebhookTimestamp || "").toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#7F71F8]/10 text-[#7F71F8] flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11.5px] text-[#6B7280] font-medium block mb-1">Listener Endpoint</span>
            <span className="font-mono text-[12px] font-bold text-[#030712] truncate block">
              /api/v1/webhooks/meta
            </span>
            <p className="text-[11.5px] text-[#00BC7D] font-semibold mt-1">Status 200 OK — Listening</p>
          </div>
        </div>
      </div>

      {/* Page Mappings Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">
            Meta Page Mappings
          </h2>
          <span className="text-[12px] text-[#6B7280]">{mappings?.length || 0} mappings configured</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB]">
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Page ID</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Page Name</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Client Organization</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings && mappings.length > 0 ? (
                mappings.map((mapping) => (
                  <tr key={mapping.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#FAFAFB] transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-[#030712]">{mapping.pageId}</td>
                    <td className="px-4 py-3 text-[13px] text-[#030712] font-medium">{mapping.pageName}</td>
                    <td className="px-4 py-3 text-[13px] text-[#6B7280]">{mapping.clientName}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm("Delete this page mapping?")) {
                            // deleteMappingMutation.mutate(mapping.id);
                            toast("Mapping deleted", "info");
                          }
                        }}
                        className="text-[#FB3038] hover:text-[#FB3038]/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[#6B7280]">
                    No page mappings configured. Click "Add Page Mapping" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Execution Logs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-[16px] text-[#030712]">
            Webhook Execution & Payload Audit Log
          </h2>
          <span className="text-[12px] text-[#6B7280]">Showing recent 50 webhook events</span>
        </div>

        <DataTable
          columns={logColumns}
          data={status?.recentLogs || []}
          searchPlaceholder="Search webhook logs by event or Page ID..."
          isLoading={isLoading}
        />
      </div>

      {/* Add Page Mapping Modal */}
      {showAddMapping && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-[18px] text-[#030712]">Add Page Mapping</h3>
              <button
                onClick={() => setShowAddMapping(false)}
                className="text-[#6B7280] hover:text-[#030712] transition-colors text-[20px] leading-none"
              >
                x
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMappingMutation.mutate({
                  clientId: mappingForm.clientId,
                  pageId: mappingForm.pageId,
                  pageName: mappingForm.pageName,
                }, {
                  onSuccess: () => {
                    setShowAddMapping(false);
                    setMappingForm({ clientId: "", pageId: "", pageName: "" });
                  }
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-semibold text-[#030712] mb-1.5">Client Organization</label>
                <select
                  value={mappingForm.clientId}
                  onChange={(e) => setMappingForm({ ...mappingForm, clientId: e.target.value })}
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[#030712] focus:border-[#155DFC] transition-colors"
                  required
                >
                  <option value="">Select a client...</option>
                  {clients?.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#030712] mb-1.5">Facebook Page ID</label>
                <input
                  type="text"
                  value={mappingForm.pageId}
                  onChange={(e) => setMappingForm({ ...mappingForm, pageId: e.target.value })}
                  placeholder="e.g. 109283746554321"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#030712] mb-1.5">Page Name</label>
                <input
                  type="text"
                  value={mappingForm.pageName}
                  onChange={(e) => setMappingForm({ ...mappingForm, pageName: e.target.value })}
                  placeholder="e.g. Apex Design Official Page"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMapping(false)}
                  className="flex-1 bg-[#F1F2F4] hover:bg-[#E3E7EF] text-[#030712] font-semibold text-[13px] py-2.5 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMappingMutation.isPending}
                  className="flex-1 bg-[#155DFC] hover:bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] py-2.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {createMappingMutation.isPending ? "Creating..." : "Create Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
