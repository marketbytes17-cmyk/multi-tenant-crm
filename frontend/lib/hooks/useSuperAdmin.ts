"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSuperAdminDashboardSummary,
  getClients,
  getClientById,
  createClient,
  updateClient,
  deactivateClient,
  getMetaMappings,
  createMetaMapping,
  deleteMetaMapping,
  getUnmatchedLeads,
  manualAssignUnmatchedLead,
  getMetaIntegrationStatus,
  sendTestLeadSimulation,
  getClientAdmins,
  resetClientAdminPassword,
  toggleClientAdminStatus,
  getSuperAdminReports,
} from "../api/superadmin";
import { AddClientInput, EditClientInput, AddMappingInput } from "../validators/superadmin";
import { useToast } from "@/lib/context/ToastContext";

// --- Queries ---

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ["superadmin", "dashboard"],
    queryFn: getSuperAdminDashboardSummary,
    refetchInterval: 60000,
  });
}

export function useClients(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["superadmin", "clients", filters],
    queryFn: () => getClients(filters),
  });
}

export function useClientDetail(clientId: string) {
  return useQuery({
    queryKey: ["superadmin", "clients", clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
  });
}

export function useMetaMappings() {
  return useQuery({
    queryKey: ["superadmin", "mappings"],
    queryFn: getMetaMappings,
  });
}

export function useUnmatchedLeads() {
  return useQuery({
    queryKey: ["superadmin", "unmatched-leads"],
    queryFn: getUnmatchedLeads,
  });
}

export function useMetaIntegrationStatus() {
  return useQuery({
    queryKey: ["superadmin", "integration"],
    queryFn: getMetaIntegrationStatus,
    refetchInterval: 60000,
  });
}

export function useClientAdmins() {
  return useQuery({
    queryKey: ["superadmin", "users"],
    queryFn: getClientAdmins,
  });
}

export function useSuperAdminReports() {
  return useQuery({
    queryKey: ["superadmin", "reports"],
    queryFn: getSuperAdminReports,
  });
}

// --- Mutations ---

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: AddClientInput) => createClient(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "clients"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      toast(`Client "${data.client.name}" created successfully!`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to create client", "error");
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditClientInput }) => updateClient(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "clients"] });
      toast(`Client "${data.name}" updated!`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update client", "error");
    },
  });
}

export function useDeactivateClientMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deactivateClient(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "clients"] });
      toast(
        `Client "${data.name}" status changed to ${data.status.toUpperCase()}`,
        data.status === "active" ? "success" : "info"
      );
    },
  });
}

export function useCreateMappingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: AddMappingInput) => createMetaMapping(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "mappings"] });
      toast(`Mapped Meta Page "${data.pageName}" to ${data.clientName}`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to create mapping", "error");
    },
  });
}

export function useDeleteMappingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMetaMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "mappings"] });
      toast("Meta Page mapping deleted", "info");
    },
  });
}

export function useAssignUnmatchedLeadMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadId, clientId }: { leadId: string; clientId: string }) =>
      manualAssignUnmatchedLead(leadId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "unmatched-leads"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "clients"] });
      toast("Unmatched lead manually assigned to client!", "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to assign lead", "error");
    },
  });
}

export function useSendTestLeadMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: sendTestLeadSimulation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "integration"] });
      toast(`Test lead generated! ID: ${data.leadId}`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to send test lead", "error");
    },
  });
}

export function useResetPasswordMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => resetClientAdminPassword(userId),
    onSuccess: (data) => {
      toast("Password reset link generated and sent!", "success");
    },
  });
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => toggleClientAdminStatus(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      toast(`User "${data.name}" status updated to ${data.status.toUpperCase()}`, "info");
    },
  });
}
