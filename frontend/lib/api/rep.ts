import { DetailedLead } from "../types/client";
import { RepDashboardSummary, RepPerformanceData, RepSettings } from "../types/rep";
import { LeadStage } from "@/components/shared/StatusTag";

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
  {
    id: "lead_102",
    name: "Marcus Aurelius",
    phone: "+1 (555) 876-5432",
    email: "marcus@stoic.org",
    status: "New",
    source: "Instagram - Modern Architecture Lead Gen",
    assignedRepName: "Jim Halpert",
    assignedRepInitials: "JH",
    createdAt: "2026-09-24T14:10:00Z",
    updatedAt: "2026-09-24T14:10:00Z",
    notes: [],
  },
  {
    id: "lead_103",
    name: "Sophia Martinez",
    phone: "+1 (555) 345-6789",
    email: "sophia@designstudio.io",
    status: "In Negotiation",
    source: "Meta Lead Form - Q3 Promo",
    assignedRepName: "Jim Halpert",
    assignedRepInitials: "JH",
    createdAt: "2026-09-23T16:45:00Z",
    updatedAt: "2026-09-24T08:00:00Z",
    notes: [
      {
        id: "note_2",
        authorName: "Jim Halpert",
        content: "Reviewing custom contract terms. Pricing proposal sent.",
        timestamp: "2026-09-24T08:00:00Z",
      },
    ],
  },
  {
    id: "lead_104",
    name: "David Wallace",
    phone: "+1 (555) 901-2345",
    email: "dwallace@dundermifflin.com",
    status: "Closed Won",
    source: "Facebook - Executive Suites Ad",
    assignedRepName: "Jim Halpert",
    assignedRepInitials: "JH",
    createdAt: "2026-09-22T11:20:00Z",
    updatedAt: "2026-09-23T15:30:00Z",
    notes: [
      {
        id: "note_3",
        authorName: "Jim Halpert",
        content: "Contract signed! $15,000 retainer paid.",
        timestamp: "2026-09-23T15:30:00Z",
      },
    ],
  },
  {
    id: "lead_105",
    name: "Rachel Green",
    phone: "+1 (555) 678-9012",
    email: "rachel@ralphlauren.com",
    status: "Closed Lost",
    source: "Instagram - Interior Consult",
    assignedRepName: "Jim Halpert",
    assignedRepInitials: "JH",
    createdAt: "2026-09-21T13:00:00Z",
    updatedAt: "2026-09-22T09:00:00Z",
    closedLostReason: "Selected local competitor due to lower timeline",
    notes: [
      {
        id: "note_4",
        authorName: "Jim Halpert",
        content: "Decided to go with a local agency due to project urgency.",
        timestamp: "2026-09-22T09:00:00Z",
      },
    ],
  },
];

let repLeadsState = [...MOCK_REP_LEADS];

export async function fetchRepDashboard(): Promise<RepDashboardSummary> {
  await new Promise((res) => setTimeout(res, 250));
  const newAssigned = repLeadsState.filter((l) => l.status === "New").length;
  const followUps = repLeadsState.filter((l) => l.status === "Contacted" || l.status === "In Negotiation");
  const won = repLeadsState.filter((l) => l.status === "Closed Won").length;

  return {
    assignedLeadsCount: newAssigned,
    followUpsDueCount: followUps.length,
    conversionRate: Math.round((won / repLeadsState.length) * 100),
    followUpsDue: followUps,
    recentActivity: [
      {
        id: "act_1",
        leadId: "lead_101",
        leadName: "Eleanor Vance",
        action: "Logged phone call and sent brochure",
        timestamp: "2026-09-24T10:15:00Z",
      },
      {
        id: "act_2",
        leadId: "lead_103",
        leadName: "Sophia Martinez",
        action: "Moved stage to In Negotiation",
        timestamp: "2026-09-24T08:00:00Z",
      },
      {
        id: "act_3",
        leadId: "lead_104",
        leadName: "David Wallace",
        action: "Marked as Closed Won ($15,000 deal)",
        timestamp: "2026-09-23T15:30:00Z",
      },
    ],
  };
}

export async function fetchRepLeads(status?: string): Promise<DetailedLead[]> {
  await new Promise((res) => setTimeout(res, 200));
  if (!status || status === "all") return repLeadsState;
  return repLeadsState.filter((l) => l.status === status);
}

export async function updateRepLeadStage(
  leadId: string,
  stage: LeadStage,
  closedLostReason?: string
): Promise<DetailedLead> {
  await new Promise((res) => setTimeout(res, 200));
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

  const updated = repLeadsState.find((l) => l.id === leadId)!;
  return updated;
}

export async function addRepLeadNote(
  leadId: string,
  content: string
): Promise<DetailedLead> {
  await new Promise((res) => setTimeout(res, 200));
  repLeadsState = repLeadsState.map((l) => {
    if (l.id === leadId) {
      const newNote = {
        id: `note_${Date.now()}`,
        authorName: "Jim Halpert (Sales Rep)",
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
  await new Promise((res) => setTimeout(res, 250));
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

export async function fetchRepSettings(): Promise<RepSettings> {
  await new Promise((res) => setTimeout(res, 200));
  return {
    name: "Jim Halpert",
    email: "jim.halpert@apexdesign.com",
    notifyOnNewLead: true,
    notifyOnFollowUp: true,
    dailyDigest: false,
  };
}

export async function updateRepSettings(settings: Partial<RepSettings>): Promise<RepSettings> {
  await new Promise((res) => setTimeout(res, 250));
  return {
    name: settings.name || "Jim Halpert",
    email: settings.email || "jim.halpert@apexdesign.com",
    notifyOnNewLead: settings.notifyOnNewLead ?? true,
    notifyOnFollowUp: settings.notifyOnFollowUp ?? true,
    dailyDigest: settings.dailyDigest ?? false,
  };
}
