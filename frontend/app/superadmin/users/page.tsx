"use client";

import React, { useState } from "react";
import { useClientAdmins, useResetPasswordMutation, useToggleUserStatusMutation } from "@/lib/hooks/useSuperAdmin";
import { DataTable } from "@/components/shared/DataTable";
import { ClientAdminUser } from "@/lib/types/superadmin";
import { ColumnDef } from "@tanstack/react-table";
import { UserCheck, KeyRound, Power, Search, Building2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";

export default function SuperAdminUsersPage() {
  const { data: users = [], isLoading } = useClientAdmins();
  const resetPasswordMutation = useResetPasswordMutation();
  const toggleUserStatusMutation = useToggleUserStatusMutation();

  const [selectedUserForDeactivate, setSelectedUserForDeactivate] = useState<ClientAdminUser | null>(null);

  const columns: ColumnDef<ClientAdminUser>[] = [
    {
      accessorKey: "name",
      header: "Admin User",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D5E3FC] text-[#155DFC] font-bold text-[11px] flex items-center justify-center shrink-0">
            {row.original.name.substring(0, 2).toUpperCase()}
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
      accessorKey: "clientName",
      header: "Client Organization",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#030712]">
          <Building2 className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>{row.original.clientName}</span>
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
              isActive ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "bg-[#6B7280]/10 text-[#6B7280]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#00BC7D]" : "bg-[#6B7280]"}`} />
            {isActive ? "Active" : "Deactivated"}
          </span>
        );
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => (
        <span className="text-[12px] text-[#6B7280]">
          {row.original.lastLogin === "Never"
            ? "Never logged in"
            : new Date(row.original.lastLogin).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => resetPasswordMutation.mutate(row.original.id)}
            disabled={resetPasswordMutation.isPending}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#155DFC] bg-[#D5E3FC]/40 hover:bg-[#D5E3FC] px-2.5 py-1 rounded-full transition-colors"
          >
            <KeyRound className="w-3 h-3" />
            <span>Reset Password</span>
          </button>

          <button
            onClick={() => setSelectedUserForDeactivate(row.original)}
            className={`p-1.5 rounded-[7px] transition-colors ${
              row.original.status === "active"
                ? "text-[#6B7280] hover:text-[#FB3038] hover:bg-[#FB3038]/10"
                : "text-[#00BC7D] hover:bg-[#00BC7D]/10"
            }`}
            title={row.original.status === "active" ? "Deactivate User" : "Reactivate User"}
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
      <div>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Client Admins & User Accounts
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Manage administrative user access across all client organizations
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search client admins by name, email, or org..."
        isLoading={isLoading}
      />

      {/* Deactivate User Confirmation Modal */}
      <Modal
        isOpen={!!selectedUserForDeactivate}
        onClose={() => setSelectedUserForDeactivate(null)}
        title="Confirm User Status Change"
        description={`Are you sure you want to ${
          selectedUserForDeactivate?.status === "active" ? "deactivate" : "reactivate"
        } account access for ${selectedUserForDeactivate?.name}?`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded-[9px] text-[12.5px] text-[#6B7280]">
            User email: <strong className="text-[#030712]">{selectedUserForDeactivate?.email}</strong>
            <br />
            Organization: <strong className="text-[#030712]">{selectedUserForDeactivate?.clientName}</strong>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSelectedUserForDeactivate(null)}
              className="px-4 py-2 text-[13px] text-[#6B7280]"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedUserForDeactivate) {
                  await toggleUserStatusMutation.mutateAsync(selectedUserForDeactivate.id);
                  setSelectedUserForDeactivate(null);
                }
              }}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
            >
              Confirm Status Change
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
