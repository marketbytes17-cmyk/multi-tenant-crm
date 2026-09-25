"use client";

import React, { useState } from "react";
import { useRepLeads, useRepUpdateStageMutation, useRepAddNoteMutation } from "@/lib/hooks/useRep";
import { DataTable } from "@/components/shared/DataTable";
import { StatusTag, LeadStage } from "@/components/shared/StatusTag";
import { Drawer } from "@/components/shared/Drawer";
import { DetailedLead } from "@/lib/types/client";
import { ColumnDef } from "@tanstack/react-table";
import { Filter, Phone, Mail, Calendar, Send } from "lucide-react";

export default function RepLeadsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  const { data: leads = [], isLoading } = useRepLeads(statusFilter);
  const updateStageMutation = useRepUpdateStageMutation();
  const addNoteMutation = useRepAddNoteMutation();

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedLead) return;

    await addNoteMutation.mutateAsync({
      leadId: selectedLead.id,
      content: newNoteContent,
    });

    setSelectedLead((prev) =>
      prev
        ? {
            ...prev,
            notes: [
              {
                id: `note_${Date.now()}`,
                authorName: "Jim Halpert (Sales Rep)",
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
      header: "Ad Campaign Source",
      cell: ({ row }) => (
        <span className="bg-[#F1F2F4] text-[#6B7280] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
          {row.original.source}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Assigned Date",
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
            My Assigned Leads
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Manage and follow up on leads assigned directly to your sales queue
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[12.5px]">
          <Filter className="w-4 h-4 text-[#6B7280]" />
          <span className="font-heading font-semibold text-[#030712]">Stage Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F1F2F4] border-0 text-[12px] font-semibold text-[#030712] py-1 px-2.5 rounded-full cursor-pointer"
          >
            <option value="all">All My Leads</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Negotiation">In Negotiation</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>

        <span className="text-[12px] text-[#6B7280]">{leads.length} assigned leads</span>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={leads}
        searchPlaceholder="Search my leads by name, phone, or source campaign..."
        onRowClick={(lead) => setSelectedLead(lead)}
        isLoading={isLoading}
      />

      {/* Scoped Lead Detail Drawer */}
      <Drawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name || "Lead Details"}
        subtitle={`Source: ${selectedLead?.source}`}
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Stage Selector */}
            <div className="bg-[#FAFAFB] border border-[#E5E7EB] rounded-[11px] p-4 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#6B7280]">Update Stage:</span>
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

            {/* Contact Information */}
            <div className="space-y-2 border-b border-[#E5E7EB] pb-4 text-[13px]">
              <h4 className="font-heading font-bold text-[14px] text-[#030712]">Contact Info</h4>
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
                <span>Assigned {new Date(selectedLead.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Call Log & Notes Timeline */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-[14px] text-[#030712]">Add Call Log / Note</h4>
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record call outcome or follow-up note..."
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
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 pt-2">
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
