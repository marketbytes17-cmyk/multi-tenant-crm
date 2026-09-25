"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientDetail, useDeactivateClientMutation, useUpdateClientMutation } from "@/lib/hooks/useSuperAdmin";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { DataTable } from "@/components/shared/DataTable";
import { KanbanBoard } from "@/components/shared/KanbanBoard";
import { StatusTag } from "@/components/shared/StatusTag";
import { Modal } from "@/components/shared/Modal";
import { Lead } from "@/components/shared/LeadCard";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Power,
  Edit,
  LogIn,
  Filter,
  Kanban,
  Users,
  GitMerge,
  AlertTriangle,
} from "lucide-react";

// Mock leads data for read-only Client Detail tabs
const MOCK_CLIENT_LEADS: Lead[] = [
  {
    id: "lead_101",
    name: "Robert Fox",
    phone: "+1 (555) 019-2834",
    email: "robert@example.com",
    status: "New",
    source: "Facebook Ad #402",
    assignedRepName: "Sarah Jenkins",
    assignedRepInitials: "SJ",
    createdAt: "2026-09-24T10:00:00Z",
  },
  {
    id: "lead_102",
    name: "Jenny Wilson",
    phone: "+1 (555) 018-9922",
    email: "jenny@example.com",
    status: "Contacted",
    source: "Instagram Story Leadform",
    assignedRepName: "Michael Scott",
    assignedRepInitials: "MS",
    createdAt: "2026-09-24T11:30:00Z",
  },
  {
    id: "lead_103",
    name: "Cody Fisher",
    phone: "+1 (555) 017-3344",
    email: "cody@example.com",
    status: "In Negotiation",
    source: "Meta Retargeting Campaign",
    assignedRepName: "Sarah Jenkins",
    assignedRepInitials: "SJ",
    createdAt: "2026-09-23T14:15:00Z",
  },
  {
    id: "lead_104",
    name: "Kristin Watson",
    phone: "+1 (555) 016-5588",
    email: "kristin@example.com",
    status: "Closed Won",
    source: "Facebook Lead Form",
    assignedRepName: "Michael Scott",
    assignedRepInitials: "MS",
    createdAt: "2026-09-22T09:45:00Z",
  },
];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { switchRole } = useAuth();
  const { toast } = useToast();

  const { data: client, isLoading, isError } = useClientDetail(resolvedParams.id);
  const deactivateMutation = useDeactivateClientMutation();
  const updateMutation = useUpdateClientMutation();

  const [activeTab, setActiveTab] = useState<"leads" | "team" | "pipeline" | "pages">("leads");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", contactEmail: "", contactPhone: "", status: "active" });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-[#E3E7EF] rounded w-32" />
        <div className="h-32 bg-[#FFFFFF] rounded-[14px] border border-[#E5E7EB]" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-8 text-center shadow-card space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#FB3038] mx-auto" />
        <h3 className="font-heading font-bold text-[16px] text-[#030712]">Client Organization Not Found</h3>
        <p className="text-[13px] text-[#6B7280]">The requested client ID does not exist in the database.</p>
        <Link
          href="/superadmin/clients"
          className="inline-block bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full"
        >
          Back to Clients List
        </Link>
      </div>
    );
  }

  const handleImpersonate = () => {
    toast(`Impersonating ${client.name}... Switching view.`, "info");
    switchRole("client_admin");
  };

  const handleOpenEdit = () => {
    setEditFormData({
      name: client.name,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      status: client.status,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({ id: client.id, input: editFormData as any });
    setIsEditModalOpen(false);
  };

  const leadColumns: ColumnDef<Lead>[] = [
    { accessorKey: "name", header: "Lead name" },
    { accessorKey: "phone", header: "Phone number" },
    { accessorKey: "source", header: "Source campaign" },
    {
      accessorKey: "status",
      header: "Stage",
      cell: ({ row }) => <StatusTag status={row.original.status} />,
    },
    { accessorKey: "assignedRepName", header: "Assigned rep" },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link & Header Card */}
      <div>
        <Link
          href="/superadmin/clients"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients List
        </Link>

        {/* Client Header Card */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[11px] bg-[#D5E3FC] text-[#155DFC] font-bold text-[18px] flex items-center justify-center shrink-0">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading font-bold text-[22px] text-[#030712]">{client.name}</h1>
                <span
                  className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                    client.status === "active" ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "bg-[#6B7280]/10 text-[#6B7280]"
                  }`}
                >
                  {client.status.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B7280] mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {client.adminEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {client.contactPhone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Created {new Date(client.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E7EB]">
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 bg-[#F1F2F4] hover:bg-[#E3E7EF] text-[#030712] font-semibold text-[12.5px] px-3.5 py-2 rounded-full transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Info</span>
            </button>

            <button
              onClick={() => deactivateMutation.mutate(client.id)}
              className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-full transition-colors ${
                client.status === "active"
                  ? "bg-[#FB3038]/10 text-[#FB3038] hover:bg-[#FB3038]/20"
                  : "bg-[#00BC7D]/10 text-[#00BC7D] hover:bg-[#00BC7D]/20"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{client.status === "active" ? "Deactivate" : "Reactivate"}</span>
            </button>

            <button
              onClick={handleImpersonate}
              className="inline-flex items-center gap-1.5 bg-[#155DFC] hover:bg-[#030712] text-[#FFFFFF] font-semibold text-[12.5px] px-4 py-2 rounded-full transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Impersonate Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-6">
        {[
          { id: "leads", label: "Leads Oversight", icon: Filter, count: client.leadCount },
          { id: "team", label: "Sales Team", icon: Users, count: client.repCount },
          { id: "pipeline", label: "Pipeline Kanban", icon: Kanban },
          { id: "pages", label: "Mapped Meta Pages", icon: GitMerge, count: client.mappedPageCount },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 text-[13.5px] font-semibold border-b-2 transition-colors font-heading ${
                isActive
                  ? "border-[#155DFC] text-[#155DFC]"
                  : "border-transparent text-[#6B7280] hover:text-[#030712]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${isActive ? "bg-[#D5E3FC] text-[#155DFC]" : "bg-[#F1F2F4] text-[#6B7280]"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "leads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[16px] text-[#030712]">Read-Only Lead Oversight</h3>
              <span className="text-[12px] text-[#6B7280]">Showing latest organization leads</span>
            </div>
            <DataTable columns={leadColumns} data={MOCK_CLIENT_LEADS} searchPlaceholder="Search leads..." />
          </div>
        )}

        {activeTab === "team" && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card space-y-4">
            <h3 className="font-heading font-bold text-[16px] text-[#030712]">Assigned Sales Representatives</h3>
            <div className="divide-y divide-[#E5E7EB]">
              {[
                { name: "Sarah Jenkins", email: "sarah@apexdesign.com", leads: 48, status: "Active" },
                { name: "Michael Scott", email: "michael@apexdesign.com", leads: 32, status: "Active" },
              ].map((rep, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D5E3FC] text-[#155DFC] font-bold text-[11px] flex items-center justify-center">
                      {rep.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-[#030712] font-heading">{rep.name}</p>
                      <p className="text-[11.5px] text-[#6B7280]">{rep.email}</p>
                    </div>
                  </div>
                  <span className="text-[12px] text-[#6B7280]">{rep.leads} leads assigned</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-[16px] text-[#030712]">Organization Pipeline Snapshot</h3>
            <KanbanBoard initialLeads={MOCK_CLIENT_LEADS} />
          </div>
        )}

        {activeTab === "pages" && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-5 shadow-card space-y-3">
            <h3 className="font-heading font-bold text-[16px] text-[#030712]">Meta Webhook Mapped Pages</h3>
            <div className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded-[9px] flex items-center justify-between text-[13px]">
              <div>
                <p className="font-bold text-[#030712]">Apex Design Official Facebook Page</p>
                <p className="text-[11.5px] text-[#6B7280] font-mono">Page ID: 109823471092834</p>
              </div>
              <span className="text-[11.5px] font-semibold text-[#00BC7D] bg-[#00BC7D]/10 px-2.5 py-1 rounded-full">
                Active Webhook
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Organization Name
            </label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Contact Email
            </label>
            <input
              type="email"
              value={editFormData.contactEmail}
              onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1 font-heading">
              Contact Phone
            </label>
            <input
              type="text"
              value={editFormData.contactPhone}
              onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] p-2.5 text-[13px]"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-[13px] text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
