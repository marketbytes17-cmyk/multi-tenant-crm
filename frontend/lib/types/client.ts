import { LeadStage } from "@/components/shared/StatusTag";
import { Lead } from "@/components/shared/LeadCard";

export interface LeadNote {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface DetailedLead extends Lead {
  email?: string;
  notes: LeadNote[];
  closedLostReason?: string;
  updatedAt: string;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  status: "active" | "invited";
  assignedLeadsCount: number;
  closedWonCount: number;
  closedLostCount: number;
  conversionRate: number;
  avatarInitials: string;
  joinedAt: string;
}

export interface ClientDashboardSummary {
  newLeadsToday: number;
  unassignedCount: number;
  activeRepsCount: number;
  pipelineActiveValue: number;
  stageFunnel: { stage: LeadStage; count: number }[];
  teamActivity: {
    repId: string;
    repName: string;
    repInitials: string;
    leadsHandled: number;
    closedWonCount: number;
    conversionRate: number;
  }[];
}

export interface ClientReportData {
  performanceOverTime: { date: string; leadsReceived: number; closedWon: number }[];
  repPerformance: {
    repId: string;
    repName: string;
    leadsHandled: number;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
  }[];
}

export interface OrgSettings {
  orgName: string;
  logoUrl?: string;
  notifyOnNewLead: boolean;
  dailySummaryDigest: boolean;
  leadAssignmentMode: "manual" | "round_robin";
}
