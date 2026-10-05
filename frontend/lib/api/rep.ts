import { DetailedLead } from "../types/client";
import { RepDashboardSummary, RepPerformanceData, RepSettings } from "../types/rep";
import { LeadStage } from "@/components/shared/StatusTag";
import { apiRequest } from "./httpClient";

const MOCK_REP_LEADS: DetailedLead[] = [
  {
    id: "lead_101",
    name: "Eleanor Vance",
    phone: "+1 (555) 234-5678",
    email: "eleanor@hillhouse.com",
    status: "Contacted",
    source: "Facebook - Luxury Homes Ad",
    assignedRepName: "Jim Halpert",
    assignedRepInitials: "JH",
    createdAt: "2026-09-24T09:30:00Z",
    updatedAt: "2026-09-24T10:15:00Z",
    notes: [
      {
        id: "note_1",
        authorName: "Jim Halpert",
        content: "Spoke on phone. Sent brochure for downtown condo units.",
        timestamp: "2026-09-24T10:15:00Z",
      },
    ],
  },
];

let repLeadsState = [...MOCK_REP_LEADS];

export async function fetchRepDashboard(): Promise<RepDashboardSummary> {
  try {
    return await apiRequest<RepDashboardSummary>("/rep/dashboard-summary");
  } catch (err) {
    console.warn("Backend /rep/dashboard-summary failed, using fallback:", err);
    const newAssigned = repLeadsState.filter((l) => l.status === "New").length;
    const followUps = repLeadsState.filter((l) => l.status === "Contacted" || l.status === "In Negotiation");
    const won = repLeadsState.filter((l) => l.status === "Closed Won").length;

    return {
      assignedLeadsCount: newAssigned,
      followUpsDueCount: followUps.length,
      conversionRate: Math.round((won / (repLeadsState.length || 1)) * 100),
      followUpsDue: followUps,
      recentActivity: [
        {
          id: "act_1",
          leadId: "lead_101",
          leadName: "Eleanor Vance",
          action: "Logged phone call and sent brochure",
          timestamp: "2026-09-24T10:15:00Z",
        },
      ],
    };
  }
}

export async function fetchRepLeads(status?: string): Promise<DetailedLead[]> {
  try {
    const raw = await apiRequest<any>("/leads");
    const items = Array.isArray(raw) ? raw : raw.items || [];
    return items.map((l: any) => ({
      id: String(l.id),
      name: l.contact_name || "Assigned Lead",
      phone: l.contact_phone || "+1 555 000 0000",
      email: l.contact_email || "rep.lead@example.com",
      status: (l.status || "NEW").toUpperCase() === "WON" ? "Closed Won" : (l.status || "NEW").toUpperCase() === "LOST" ? "Closed Lost" : (l.status || "NEW").toUpperCase() === "NEGOTIATING" ? "In Negotiation" : (l.status || "NEW").toUpperCase() === "CONTACTED" ? "Contacted" : "New",
      source: `Form ${l.leadgen_id ? l.leadgen_id.substring(0, 6) : "Meta"}`,
      assignedRepName: "Sales Rep",
      assignedRepInitials: "SR",
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.updated_at || new Date().toISOString(),
      notes: (l.notes || "").split("\n").filter(Boolean).map((nStr: string, idx: number) => ({
        id: `note_${idx}`,
        authorName: "Rep",
        content: nStr,
        timestamp: new Date().toISOString(),
      })),
    }));
  } catch (err) {
    if (!status || status === "all") return repLeadsState;
    return repLeadsState.filter((l) => l.status === status);
  }
}

export async function updateRepLeadStage(
  leadId: string,
  stage: LeadStage,
  closedLostReason?: string
): Promise<DetailedLead> {
  const backendStatusMap: Record<string, string> = {
    "New": "NEW",
    "Contacted": "CONTACTED",
    "In Negotiation": "NEGOTIATING",
    "Closed Won": "WON",
    "Closed Lost": "LOST",
  };
  const mappedStatus = backendStatusMap[stage] || "NEW";

  try {
    await apiRequest<any>(`/leads/${leadId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: mappedStatus }),
    });
  } catch (err) {
    console.warn("Backend PATCH /leads/{id}/status failed, using fallback:", err);
  }

  repLeadsState = repLeadsState.map((l) => {
    if (l.id === leadId) {
      return {
        ...l,
        status: stage,
        updatedAt: new Date().toISOString(),
        closedLostReason: stage === "Closed Lost" ? closedLostReason || l.closedLostReason : undefined,
      };
    }
    return l;
  });

  return repLeadsState.find((l) => l.id === leadId)!;
}

export async function addRepLeadNote(leadId: string, content: string): Promise<DetailedLead> {
  try {
    await apiRequest<any>(`/leads/${leadId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.warn("Backend POST /leads/{id}/notes failed, using fallback:", err);
  }

  repLeadsState = repLeadsState.map((l) => {
    if (l.id === leadId) {
      const newNote = {
        id: `note_${Date.now()}`,
        authorName: "Sales Rep",
        content,
        timestamp: new Date().toISOString(),
      };
      return { ...l, updatedAt: new Date().toISOString(), notes: [newNote, ...l.notes] };
    }
    return l;
  });

  return repLeadsState.find((l) => l.id === leadId)!;
}

export async function fetchRepPerformance(): Promise<RepPerformanceData> {
  try {
    return await apiRequest<RepPerformanceData>("/rep/performance");
  } catch (err) {
    return {
      leadsHandled: 24,
      closedWonCount: 8,
      closedLostCount: 3,
      conversionRate: 33.3,
      avgResponseTimeHours: 1.4,
      performanceTrend: [
        { date: "Sep 18", leadsReceived: 3, closedWon: 1 },
        { date: "Sep 19", leadsReceived: 5, closedWon: 2 },
        { date: "Sep 20", leadsReceived: 4, closedWon: 1 },
        { date: "Sep 21", leadsReceived: 6, closedWon: 2 },
        { date: "Sep 22", leadsReceived: 2, closedWon: 1 },
        { date: "Sep 23", leadsReceived: 4, closedWon: 1 },
        { date: "Sep 24", leadsReceived: 3, closedWon: 2 },
      ],
    };
  }
}

export async function fetchRepSettings(): Promise<RepSettings> {
  try {
    return await apiRequest<RepSettings>("/rep/settings");
  } catch (err) {
    return {
      name: "Demo Sales Rep",
      email: "salesrep@demoagencyclient.com",
      notifyOnNewLead: true,
      notifyOnFollowUp: true,
      dailyDigest: false,
    };
  }
}

export async function updateRepSettings(settings: Partial<RepSettings>): Promise<RepSettings> {
  try {
    return await apiRequest<RepSettings>("/rep/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  } catch (err) {
    return {
      name: settings.name || "Demo Sales Rep",
      email: settings.email || "salesrep@demoagencyclient.com",
      notifyOnNewLead: settings.notifyOnNewLead ?? true,
      notifyOnFollowUp: settings.notifyOnFollowUp ?? true,
      dailyDigest: settings.dailyDigest ?? false,
    };
  }
}
