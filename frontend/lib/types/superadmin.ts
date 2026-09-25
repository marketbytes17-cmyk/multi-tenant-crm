import { Lead } from "@/components/shared/LeadCard";

export interface ClientOrg {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  adminEmail: string;
  status: "active" | "inactive";
  leadCount: number;
  lastActivityDate: string;
  createdAt: string;
  mappedPageCount: number;
  repCount: number;
}

export interface MetaPageMapping {
  id: string;
  pageId: string;
  pageName: string;
  adId?: string;
  clientId: string;
  clientName: string;
  createdAt: string;
}

export interface UnmatchedLead {
  id: string;
  rawPageId: string;
  rawAdId?: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  timestamp: string;
  payload: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  status: "success" | "failure";
  pageId: string;
  details: string;
}

export interface MetaIntegrationStatus {
  tokenStatus: "valid" | "expired" | "warning";
  tokenExpiresAt: string;
  lastWebhookTimestamp: string;
  metaConnectionHealthy: boolean;
  recentLogs: WebhookLog[];
}

export interface SuperAdminDashboardSummary {
  totalLeadsToday: number;
  totalLeadsWeek: number;
  totalLeadsMonth: number;
  activeClientsCount: number;
  totalAdSpendMonth: number;
  systemStatus: {
    metaConnection: "healthy" | "down";
    lastChecked: string;
  };
  leadsOverTime: { date: string; leads: number }[];
  recentActivity: {
    id: string;
    clientName: string;
    action: string;
    timestamp: string;
    type: "lead" | "client" | "system";
  }[];
}

export interface ClientAdminUser {
  id: string;
  name: string;
  email: string;
  clientId: string;
  clientName: string;
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export interface SuperAdminReportData {
  leadsByClient: { clientName: string; leads: number }[];
  conversionByClient: {
    clientId: string;
    clientName: string;
    totalLeads: number;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
  }[];
}
