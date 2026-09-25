"use client";

import React, { useState } from "react";
import {
  useClientLeads,
  useClientTeam,
  useAssignLeadMutation,
  useUpdateLeadStageMutation,
  useAddNoteMutation,
} from "@/lib/hooks/useClient";
import { DataTable } from "@/components/shared/DataTable";
import { StatusTag, LeadStage } from "@/components/shared/StatusTag";
import { Drawer } from "@/components/shared/Drawer";
import { DetailedLead } from "@/lib/types/client";
import { ColumnDef } from "@tanstack/react-table";
import { Filter, Phone, Mail, User, Calendar, MessageSquare, Send, Plus, Check } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";

export default function ClientLeadsPage() {
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  const { data: leads = [], isLoading } = useClientLeads({
    status: statusFilter,
    assignedRep: repFilter,
  });

  const { data: team = [] } = useClientTeam();
  const assignMutation = useAssignLeadMutation();
  const updateStageMutation = useUpdateLeadStageMutation();
  const addNoteMutation = useAddNoteMutation();

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedLead) return;

    await addNoteMutation.mutateAsync({
      leadId: selectedLead.id,
      input: { content: newNoteContent },
    });

    // Update local drawer state optimistically
    setSelectedLead((prev) =>
      prev
        ? {
            ...prev,
            notes: [
              {
                id: `note_${Date.now()}`,
                authorName: "Client Admin",
                content: newNoteContent,
                timestamp: new Date().toISOString(),
              },
              ...prev.notes,
            ],
          }
        : null
    );

    setNewNoteContent("");
  };

  const columns: ColumnDef<DetailedLead>[] = [
    {
      accessorKey: "name",
      header: "Lead Contact",
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
      accessorKey: "assignedRepName",
      header: "Assigned Rep",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={row.original.assignedRepName ? team.find((r) => r.name === row.original.assignedRepName)?.id || "" : ""}
            onChange={(e) => {
              if (e.target.value) {
                assignMutation.mutate({ leadId: row.original.id, repId: e.target.value });
              }
            }}
            className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] text-[12px] p-1.5 focus:border-[#155DFC]"
          >
            <option value="">Unassigned</option>
            {team.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Received",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#6B7280]">
          {new Date(row.original.createdAt).toLocaleDateString()} {new Date(row.original.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Leads Inbox
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            All incoming leads captured from active Meta campaigns
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <span className="font-heading font-semibold text-[#030712]">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F1F2F4] border-0 text-[12px] font-semibold text-[#030712] py-1 px-2.5 rounded-full cursor-pointer"
            >
              <option value="all">All Stages</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Negotiation">In Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-[#E5E7EB] pl-4">
            <User className="w-4 h-4 text-[#6B7280]" />
            <span className="font-heading font-semibold text-[#030712]">Assignment:</span>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="bg-[#F1F2F4] border-0 text-[12px] font-semibold text-[#030712] py-1 px-2.5 rounded-full cursor-pointer"
            >
              <option value="all">All Leads</option>
              <option value="unassigned">Unassigned Only</option>
              {team.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-[12px] text-[#6B7280]">{leads.length} leads matching filters</span>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={leads}
        searchPlaceholder="Search leads by name, phone, or campaign source..."
        onRowClick={(lead) => setSelectedLead(lead)}
        isLoading={isLoading}
      />

      {/* Lead Detail Drawer (2.4) */}
      <Drawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name || "Lead Details"}
        subtitle={`Captured via ${selectedLead?.source}`}
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Status & Rep Assignment Control */}
            <div className="bg-[#FAFAFB] border border-[#E5E7EB] rounded-[11px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#6B7280]">Current Stage:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => {
                    const newStage = e.target.value as LeadStage;
                    updateStageMutation.mutate({ leadId: selectedLead.id, stage: newStage });
                    setSelectedLead({ ...selectedLead, status: newStage });
                  }}
                  className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] text-[12.5px] font-bold p-1.5"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Negotiation">In Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3">
                <span className="text-[12px] font-semibold text-[#6B7280]">Assigned Rep:</span>
                <select
                  value={team.find((r) => r.name === selectedLead.assignedRepName)?.id || ""}
                  onChange={(e) => {
                    const rep = team.find((r) => r.id === e.target.value);
                    if (rep) {
                      assignMutation.mutate({ leadId: selectedLead.id, repId: rep.id });
                      setSelectedLead({
                        ...selectedLead,
                        assignedRepName: rep.name,
                        assignedRepInitials: rep.avatarInitials,
                      });
                    }
                  }}
                  className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] text-[12.5px] font-medium p-1.5"
                >
                  <option value="">Unassigned</option>
                  {team.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="space-y-2 border-b border-[#E5E7EB] pb-4">
              <h4 className="font-heading font-bold text-[14px] text-[#030712]">Contact Information</h4>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex items-center gap-2 text-[#030712]">
                  <Phone className="w-4 h-4 text-[#6B7280]" />
                  <span>{selectedLead.phone}</span>
                </div>
                {selectedLead.email && (
                  <div className="flex items-center gap-2 text-[#030712]">
                    <Mail className="w-4 h-4 text-[#6B7280]" />
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#6B7280] text-[12px]">
                  <Calendar className="w-4 h-4 text-[#6B7280]" />
                  <span>Received {new Date(selectedLead.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Activity & Notes Timeline */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-[14px] text-[#030712]">Activity & Notes Timeline</h4>

              {/* Add Note Form */}
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a call note or follow-up update..."
                  className="flex-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] px-3 py-2 text-[12.5px] focus:border-[#155DFC]"
                />
                <button
                  type="submit"
                  disabled={!newNoteContent.trim() || addNoteMutation.isPending}
                  className="bg-[#030712] text-[#FFFFFF] px-3 py-2 rounded-[9px] hover:bg-[#155DFC] transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedLead.notes.length === 0 ? (
                  <p className="text-[12px] text-[#6B7280] italic">No notes added yet.</p>
                ) : (
                  selectedLead.notes.map((note) => (
                    <div key={note.id} className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded-[9px] space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span className="font-bold text-[#030712] font-heading">{note.authorName}</span>
                        <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[12.5px] text-[#030712]">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
