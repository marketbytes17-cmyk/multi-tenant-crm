"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/shared/StatCard";
import { useRepDashboard, useRepUpdateStageMutation, useRepAddNoteMutation } from "@/lib/hooks/useRep";
import { Drawer } from "@/components/shared/Drawer";
import { StatusTag, LeadStage } from "@/components/shared/StatusTag";
import { DetailedLead } from "@/lib/types/client";
import {
  Filter,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  Send,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function SalesRepDashboardPage() {
  const router = useRouter();
  const { data: summary, isLoading, isError, refetch } = useRepDashboard();
  const updateStageMutation = useRepUpdateStageMutation();
  const addNoteMutation = useRepAddNoteMutation();

  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#E3E7EF] rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-8 text-center shadow-card">
        <AlertTriangle className="w-8 h-8 text-[#FB3038] mx-auto mb-2" />
        <h3 className="font-heading font-bold text-[16px] text-[#030712]">Failed to load Rep Dashboard</h3>
        <p className="text-[13px] text-[#6B7280] mb-4">Could not retrieve assigned lead metrics.</p>
        <button
          onClick={() => refetch()}
          className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Sales Representative Workspace
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Your personal assigned lead queue, follow-ups due today, and sales performance metrics
          </p>
        </div>

        <Link
          href="/rep/leads"
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <Filter className="w-4 h-4 text-[#D5E3FC]" />
          <span>View My Assigned Leads</span>
        </Link>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="New Assigned Leads"
          value={summary.assignedLeadsCount.toString()}
          icon={Filter}
          tint="blue"
          trend={{ value: "Requires action", isPositive: true }}
          actionLabel="View Leads"
          onAction={() => router.push("/rep/leads")}
        />

        <StatCard
          title="Follow-ups Due Today"
          value={summary.followUpsDueCount.toString()}
          icon={Clock}
          tint="orange"
          highlightAlert={summary.followUpsDueCount > 0}
          actionLabel="Open Pipeline"
          onAction={() => router.push("/rep/pipeline")}
        />

        <StatCard
          title="Personal Conversion Rate"
          value={`${summary.conversionRate}%`}
          icon={TrendingUp}
          tint="violet"
          trend={{ value: "Target: >25%", isPositive: summary.conversionRate >= 25 }}
          actionLabel="Performance"
          onAction={() => router.push("/rep/performance")}
        />
      </div>

      {/* Main Grid: Urgent Follow-ups List + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Follow-ups Due List (2 cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="font-heading font-bold text-[16px] text-[#030712]">
                Follow-ups Due Today ({summary.followUpsDue.length})
              </h2>
              <p className="text-[12px] text-[#6B7280]">Active leads currently in Contacted or Negotiation stage</p>
            </div>
            <Link
              href="/rep/pipeline"
              className="text-[12.5px] font-semibold text-[#155DFC] hover:underline flex items-center gap-1"
            >
              <span>Open My Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summary.followUpsDue.length === 0 ? (
              <p className="text-[13px] text-[#6B7280] italic py-4 text-center">
                No urgent follow-ups due today. Great job staying on top of your queue!
              </p>
            ) : (
              summary.followUpsDue.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="p-4 bg-[#FAFAFB] border border-[#E5E7EB] rounded-[11px] hover:border-[#155DFC] hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-[14px] text-[#030712]">
                        {lead.name}
                      </span>
                      <StatusTag status={lead.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280]" />
                        {lead.phone}
                      </span>
                      <span>•</span>
                      <span>Source: {lead.source}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                    }}
                    className="bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors self-start sm:self-auto shrink-0"
                  >
                    Open Lead Drawer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Log Feed (1 col) */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
              <h2 className="font-heading font-bold text-[16px] text-[#030712]">Recent Rep Activity</h2>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Log</span>
            </div>

            <div className="space-y-3">
              {summary.recentActivity.map((act) => (
                <div key={act.id} className="pb-3 border-b border-[#E5E7EB] last:border-b-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span className="font-bold text-[#030712] font-heading">{act.leadName}</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-[12.5px] text-[#030712]">{act.action}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/rep/performance"
            className="mt-4 text-center text-[12px] font-semibold text-[#155DFC] hover:underline flex items-center justify-center gap-1"
          >
            <span>View Full Performance Metrics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Scoped Lead Detail Drawer (3.4) */}
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

            {/* Contact Details */}
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
            </div>

            {/* Note & Call Log Entry Form */}
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

              {/* Notes Timeline */}
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
