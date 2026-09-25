"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useClientTeam, useInviteRepMutation, useRemoveRepMutation } from "@/lib/hooks/useClient";
import { DataTable } from "@/components/shared/DataTable";
import { SalesRep } from "@/lib/types/client";
import { InviteRepSchema } from "@/lib/validators/client";
import { Modal } from "@/components/shared/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { UserPlus, Trash2, Mail, Users, CheckCircle2, Send } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";

export default function ClientTeamPage() {
  const { toast } = useToast();
  const { data: team = [], isLoading } = useClientTeam();
  const inviteMutation = useInviteRepMutation();
  const removeMutation = useRemoveRepMutation();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedRepForRemove, setSelectedRepForRemove] = useState<SalesRep | null>(null);

  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    sendInviteEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = InviteRepSchema.safeParse(inviteData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setErrors(errMap);
      return;
    }

    await inviteMutation.mutateAsync(validation.data);
    setIsInviteModalOpen(false);
    setInviteData({ name: "", email: "", sendInviteEmail: true });
  };

  const columns: ColumnDef<SalesRep>[] = [
    {
      accessorKey: "name",
      header: "Sales Representative",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D5E3FC] text-[#155DFC] font-bold text-[11px] flex items-center justify-center shrink-0">
            {row.original.avatarInitials}
          </div>
          <div>
            <span className="font-heading font-semibold text-[13.5px] text-[#030712] block">
              {row.original.name}
            </span>
            <span className="text-[11.5px] text-[#6B7280]">{row.original.email}</span>
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
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isActive ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "bg-[#F54900]/10 text-[#F54900]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#00BC7D]" : "bg-[#F54900]"}`} />
            {isActive ? "Active" : "Invite Pending"}
          </span>
        );
      },
    },
    {
      accessorKey: "assignedLeadsCount",
      header: "Assigned Leads",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#030712] text-[13px]">
          {row.original.assignedLeadsCount} leads
        </span>
      ),
    },
    {
      accessorKey: "conversionRate",
      header: "Conversion Rate",
      cell: ({ row }) => (
        <span className="font-heading font-bold text-[#00BC7D] text-[12.5px]">
          {row.original.conversionRate}%
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedRepForRemove(row.original)}
          className="p-1.5 text-[#6B7280] hover:text-[#FB3038] hover:bg-[#FB3038]/10 rounded-[7px] transition-colors"
          title="Remove Representative"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
            Sales Team Representatives
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Manage sales reps, invite team members, and track individual lead capacity
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#030712] hover:bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Rep</span>
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={team}
        searchPlaceholder="Search team reps by name or email..."
        isLoading={isLoading}
      />

      {/* Invite Rep Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Sales Representative"
        description="Send an invitation link for a new sales rep to join your organization"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Full Name *
            </label>
            <input
              type="text"
              value={inviteData.name}
              onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              placeholder="e.g. Pam Beesly"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
            />
            {errors.name && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Work Email Address *
            </label>
            <input
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              placeholder="rep@apexdesign.com"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
            />
            {errors.email && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.email}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 text-[13px] text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2 rounded-full hover:bg-[#155DFC] transition-colors disabled:opacity-50"
            >
              {inviteMutation.isPending ? "Sending Invite..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Rep Confirmation Modal */}
      <Modal
        isOpen={!!selectedRepForRemove}
        onClose={() => setSelectedRepForRemove(null)}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${selectedRepForRemove?.name} from your team?`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-[13px] text-[#6B7280]">
            Any leads currently assigned to this representative will be marked as <strong>Unassigned</strong> and moved to the priority assignment queue.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSelectedRepForRemove(null)}
              className="px-4 py-2 text-[13px] text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedRepForRemove) {
                  await removeMutation.mutateAsync(selectedRepForRemove.id);
                  setSelectedRepForRemove(null);
                }
              }}
              className="bg-[#FB3038] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2 rounded-full hover:bg-[#030712] transition-colors"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
