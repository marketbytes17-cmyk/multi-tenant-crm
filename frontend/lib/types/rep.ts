import { DetailedLead } from "./client";

export interface RepDashboardSummary {
  assignedLeadsCount: number;
  followUpsDueCount: number;
  conversionRate: number;
  followUpsDue: DetailedLead[];
  recentActivity: {
    id: string;
    leadId: string;
    leadName: string;
    action: string;
    timestamp: string;
  }[];
}

export interface RepPerformanceData {
  leadsHandled: number;
  closedWonCount: number;
  closedLostCount: number;
  conversionRate: number;
  avgResponseTimeHours: number;
  performanceTrend: {
    date: string;
    leadsReceived: number;
    closedWon: number;
  }[];
}

export interface RepSettings {
  name: string;
  email: string;
  notifyOnNewLead: boolean;
  notifyOnFollowUp: boolean;
  dailyDigest: boolean;
}
