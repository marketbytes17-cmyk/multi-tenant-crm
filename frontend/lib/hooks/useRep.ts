import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRepDashboard,
  fetchRepLeads,
  updateRepLeadStage,
  addRepLeadNote,
  fetchRepPerformance,
  fetchRepSettings,
  updateRepSettings,
} from "../api/rep";
import { RepSettings } from "../types/rep";
import { LeadStage } from "@/components/shared/StatusTag";
import { useToast } from "../context/ToastContext";

export function useRepDashboard() {
  return useQuery({
    queryKey: ["rep", "dashboard"],
    queryFn: fetchRepDashboard,
    refetchInterval: 30000,
  });
}

export function useRepLeads(status?: string) {
  return useQuery({
    queryKey: ["rep", "leads", status],
    queryFn: () => fetchRepLeads(status),
    refetchInterval: 30000,
  });
}

export function useRepUpdateStageMutation() {
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
    }) => updateRepLeadStage(leadId, stage, closedLostReason),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ["rep", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["rep", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rep", "performance"] });
      toast(`Lead stage updated to ${updatedLead.status}`, "success");
    },
    onError: () => {
      toast("Failed to update lead stage. Please try again.", "error");
    },
  });
}

export function useRepAddNoteMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadId, content }: { leadId: string; content: string }) =>
      addRepLeadNote(leadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rep", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["rep", "dashboard"] });
      toast("Call note saved!", "success");
    },
    onError: () => {
      toast("Failed to add note.", "error");
    },
  });
}

export function useRepPerformance() {
  return useQuery({
    queryKey: ["rep", "performance"],
    queryFn: fetchRepPerformance,
  });
}

export function useRepSettings() {
  return useQuery({
    queryKey: ["rep", "settings"],
    queryFn: fetchRepSettings,
  });
}

export function useUpdateRepSettingsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: Partial<RepSettings>) => updateRepSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rep", "settings"] });
      toast("Profile & notification settings saved!", "success");
    },
    onError: () => {
      toast("Failed to save settings.", "error");
    },
  });
}
