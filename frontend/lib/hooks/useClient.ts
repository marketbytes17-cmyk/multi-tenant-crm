"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClientDashboardSummary,
  getClientLeads,
  getUnassignedLeads,
  getLeadById,
  assignLead,
  bulkAssignLeads,
  updateLeadStage,
  addLeadNote,
  getClientTeam,
  inviteRep,
  removeRep,
  getClientReports,
  updateClientSettings,
} from "../api/client";
import { InviteRepInput, AddNoteInput, ClientSettingsInput } from "../validators/client";
import { LeadStage } from "@/components/shared/StatusTag";
import { useToast } from "@/lib/context/ToastContext";

// --- Queries ---

export function useClientDashboard() {
  return useQuery({
    queryKey: ["client", "dashboard"],
    queryFn: getClientDashboardSummary,
    refetchInterval: 30000, // 30s polling per FRONTEND_ARCHITECTURE.md §4
  });
}

export function useClientLeads(filters?: { status?: string; assignedRep?: string; search?: string }) {
  return useQuery({
    queryKey: ["client", "leads", filters],
    queryFn: () => getClientLeads(filters),
    refetchInterval: 30000,
  });
}

export function useUnassignedLeads() {
  return useQuery({
    queryKey: ["client", "leads", "unassigned"],
    queryFn: getUnassignedLeads,
    refetchInterval: 30000,
  });
}

export function useLeadDetail(leadId: string | null) {
  return useQuery({
    queryKey: ["client", "leads", leadId],
    queryFn: () => (leadId ? getLeadById(leadId) : null),
    enabled: !!leadId,
  });
}

export function useClientTeam() {
  return useQuery({
    queryKey: ["client", "team"],
    queryFn: getClientTeam,
  });
}

export function useClientReports() {
  return useQuery({
    queryKey: ["client", "reports"],
    queryFn: getClientReports,
  });
}

// --- Mutations ---

export function useAssignLeadMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadId, repId }: { leadId: string; repId: string }) => assignLead(leadId, repId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      toast(`Lead "${data.name}" assigned to ${data.assignedRepName}!`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to assign lead", "error");
    },
  });
}

export function useBulkAssignLeadsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadIds, repId }: { leadIds: string[]; repId: string }) =>
      bulkAssignLeads(leadIds, repId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      toast(`Successfully assigned ${data.count} leads in bulk!`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to bulk assign leads", "error");
    },
  });
}

export function useUpdateLeadStageMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      leadId,
      stage,
      closedLostReason,
    }: {
      leadId: string;
      stage: LeadStage;
      closedLostReason?: string;
    }) => updateLeadStage(leadId, stage, closedLostReason),
    onMutate: async ({ leadId, stage }) => {
      // Optimistic Update per FRONTEND_ARCHITECTURE.md §4
      await queryClient.cancelQueries({ queryKey: ["client", "leads"] });

      const previousLeads = queryClient.getQueryData(["client", "leads"]);

      queryClient.setQueryData(["client", "leads"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((l) => (l.id === leadId ? { ...l, status: stage } : l));
      });

      return { previousLeads };
    },
    onError: (err: any, _, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["client", "leads"], context.previousLeads);
      }
      toast(err.message || "Failed to update stage", "error");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      toast(`Lead stage changed to "${data.status}"`, "success");
    },
  });
}

export function useAddNoteMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: AddNoteInput }) =>
      addLeadNote(leadId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client", "leads", data.id] });
      toast("Note added to lead timeline!", "success");
    },
  });
}

export function useInviteRepMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: InviteRepInput) => inviteRep(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client", "team"] });
      toast(`Invitation sent to ${data.name} (${data.email})!`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to send invitation", "error");
    },
  });
}

export function useRemoveRepMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (repId: string) => removeRep(repId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", "team"] });
      toast("Sales rep removed from team", "info");
    },
  });
}

export function useUpdateClientSettingsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: ClientSettingsInput) => updateClientSettings(input),
    onSuccess: () => {
      toast("Organization settings saved!", "success");
    },
  });
}
