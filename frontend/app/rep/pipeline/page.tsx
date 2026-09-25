"use client";

import React, { useState } from "react";
import { useRepLeads, useRepUpdateStageMutation } from "@/lib/hooks/useRep";
import { KanbanBoard } from "@/components/shared/KanbanBoard";
import { Drawer } from "@/components/shared/Drawer";
import { Modal } from "@/components/shared/Modal";
import { DetailedLead } from "@/lib/types/client";
import { LeadStage, StatusTag } from "@/components/shared/StatusTag";
import { Phone, Mail, Send } from "lucide-react";

export default function RepPipelinePage() {
  const { data: leads = [], isLoading } = useRepLeads();
  const updateStageMutation = useRepUpdateStageMutation();

  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [closedLostModal, setClosedLostModal] = useState<{
    leadId: string;
    targetStage: LeadStage;
  } | null>(null);
  const [closedLostReason, setClosedLostReason] = useState("");

  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    if (newStage === "Closed Lost") {
      setClosedLostModal({ leadId, targetStage: newStage });
    } else {
      updateStageMutation.mutate({ leadId, stage: newStage });
    }
  };

  const handleConfirmClosedLost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closedLostModal || !closedLostReason.trim()) return;

    updateStageMutation.mutate({
      leadId: closedLostModal.leadId,
      stage: "Closed Lost",
      closedLostReason: closedLostReason.trim(),
    });

    setClosedLostModal(null);
    setClosedLostReason("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#E3E7EF] rounded w-64" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[240px] h-96 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB] shrink-0" />
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
            My Pipeline Kanban
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Drag cards across stages to manage your personal sales pipeline velocity
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        initialLeads={leads}
        onStageChange={handleStageChange}
        onLeadClick={(lead) => setSelectedLead(lead as DetailedLead)}
      />

      {/* Closed Lost Reason Modal */}
      <Modal
        isOpen={!!closedLostModal}
        onClose={() => {
          setClosedLostModal(null);
          setClosedLostReason("");
        }}
        title="Reason for Closing as Lost"
        description="Please provide a brief reason why this lead was marked as Closed Lost."
      >
        <form onSubmit={handleConfirmClosedLost} className="space-y-4 pt-1">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Closed Lost Reason *
            </label>
            <textarea
              rows={3}
              value={closedLostReason}
              onChange={(e) => setClosedLostReason(e.target.value)}
              placeholder="e.g. Budget constraints, opted for local vendor, bad timing..."
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px] focus:border-[#155DFC]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setClosedLostModal(null);
                setClosedLostReason("");
              }}
              className="px-4 py-2 text-[13px] text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!closedLostReason.trim() || updateStageMutation.isPending}
              className="bg-[#FB3038] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2 rounded-full hover:bg-[#030712] transition-colors disabled:opacity-50"
            >
              Confirm Closed Lost
            </button>
          </div>
        </form>
      </Modal>

      {/* Scoped Lead Detail Drawer */}
      <Drawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name || "Lead Details"}
        subtitle={`Source: ${selectedLead?.source}`}
      >
        {selectedLead && (
          <div className="space-y-4 text-[13px]">
            <div className="flex items-center justify-between p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded-[9px]">
              <span className="text-[#6B7280] font-medium">Stage:</span>
              <StatusTag status={selectedLead.status} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#6B7280]" />
                <span>{selectedLead.phone}</span>
              </div>
              {selectedLead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6B7280]" />
                  <span>{selectedLead.email}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
