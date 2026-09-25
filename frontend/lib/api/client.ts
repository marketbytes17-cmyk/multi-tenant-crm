import { DetailedLead, SalesRep, ClientDashboardSummary, ClientReportData, OrgSettings } from "../types/client";
import { InviteRepInput, AddNoteInput, ClosedLostReasonInput, ClientSettingsInput } from "../validators/client";
import { LeadStage } from "@/components/shared/StatusTag";

let MOCK_LEADS: DetailedLead[] = [
  {
    id: "lead_101",
    name: "Robert Fox",
    phone: "+1 (555) 019-2834",
    email: "robert.fox@example.com",
    status: "New",
    source: "Facebook Ad #402",
    assignedRepName: undefined,
    assignedRepInitials: undefined,
    createdAt: "2026-09-24T17:30:00Z",
    updatedAt: "2026-09-24T17:30:00Z",
    notes: [
      {
        id: "note_1",
        authorName: "System",
        content: "Lead captured via Meta Webhook from Facebook Campaign #402",
        timestamp: "2026-09-24T17:30:00Z",
      },
    ],
  },
  {
    id: "lead_102",
    name: "Jenny Wilson",
    phone: "+1 (555) 018-9922",
    email: "jenny.w@example.com",
    status: "Contacted",
    source: "Instagram Story Leadform",
    assignedRepName: "Sarah Jenkins",
    assignedRepInitials: "SJ",
    createdAt: "2026-09-24T15:45:00Z",
    updatedAt: "2026-09-24T16:10:00Z",
    notes: [
      {
        id: "note_2",
        authorName: "Sarah Jenkins",
        content: "Left voicemail. Sent intro message via WhatsApp.",
        timestamp: "2026-09-24T16:10:00Z",
      },
    ],
  },
  {
    id: "lead_103",
    name: "Cody Fisher",
    phone: "+1 (555) 017-3344",
    email: "cody.fisher@example.com",
    status: "In Negotiation",
    source: "Meta Retargeting Campaign",
    assignedRepName: "Sarah Jenkins",
    assignedRepInitials: "SJ",
    createdAt: "2026-09-23T14:15:00Z",
    updatedAt: "2026-09-24T11:20:00Z",
    notes: [
      {
        id: "note_3",
        authorName: "Sarah Jenkins",
        content: "Discussed custom solar package proposal. Waiting for approval.",
        timestamp: "2026-09-24T11:20:00Z",
      },
    ],
  },
  {
    id: "lead_104",
    name: "Kristin Watson",
    phone: "+1 (555) 016-5588",
    email: "kristin.w@example.com",
    status: "Closed Won",
    source: "Facebook Lead Form",
    assignedRepName: "Michael Scott",
    assignedRepInitials: "MS",
    createdAt: "2026-09-22T09:45:00Z",
    updatedAt: "2026-09-24T14:00:00Z",
    notes: [
      {
        id: "note_4",
        authorName: "Michael Scott",
        content: "Contract signed! Closed deal worth $12,500.",
        timestamp: "2026-09-24T14:00:00Z",
      },
    ],
  },
  {
    id: "lead_105",
    name: "Darlene Robertson",
    phone: "+1 (555) 015-7711",
    email: "darlene@example.com",
    status: "New",
    source: "Facebook Lead Form",
    assignedRepName: undefined,
    assignedRepInitials: undefined,
    createdAt: "2026-09-24T18:05:00Z",
    updatedAt: "2026-09-24T18:05:00Z",
    notes: [],
  },
  {
    id: "lead_106",
    name: "Eleanor Pena",
    phone: "+1 (555) 014-4433",
    email: "eleanor.p@example.com",
    status: "Closed Lost",
    source: "Instagram Lead Form",
    assignedRepName: "Michael Scott",
    assignedRepInitials: "MS",
    closedLostReason: "Budget constraints — competitor offered lower price.",
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-23T16:30:00Z",
    notes: [
      {
        id: "note_5",
        authorName: "Michael Scott",
        content: "Client chose local vendor due to pricing.",
        timestamp: "2026-09-23T16:30:00Z",
      },
    ],
  },
];

let MOCK_REPS: SalesRep[] = [
  {
    id: "rep_101",
    name: "Sarah Jenkins",
    email: "sarah@apexdesign.com",
    status: "active",
    assignedLeadsCount: 14,
    closedWonCount: 8,
    closedLostCount: 2,
    conversionRate: 57,
    avatarInitials: "SJ",
    joinedAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "rep_102",
    name: "Michael Scott",
    email: "michael@apexdesign.com",
    status: "active",
    assignedLeadsCount: 12,
    closedWonCount: 5,
    closedLostCount: 3,
    conversionRate: 41,
    avatarInitials: "MS",
    joinedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "rep_103",
    name: "Pam Beesly",
    email: "pam@apexdesign.com",
    status: "invited",
    assignedLeadsCount: 0,
    closedWonCount: 0,
    closedLostCount: 0,
    conversionRate: 0,
    avatarInitials: "PB",
    joinedAt: "2026-09-24T12:00:00Z",
  },
];

let MOCK_ORG_SETTINGS: OrgSettings = {
  orgName: "Apex Design Co.",
  notifyOnNewLead: true,
  dailySummaryDigest: true,
  leadAssignmentMode: "manual",
};

// --- Client API Methods ---

export async function getClientDashboardSummary(): Promise<ClientDashboardSummary> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const unassigned = MOCK_LEADS.filter((l) => !l.assignedRepName).length;
      const todayCount = MOCK_LEADS.filter(
        (l) => new Date(l.createdAt).toDateString() === new Date().toDateString()
      ).length;

      resolve({
        newLeadsToday: todayCount || 4,
        unassignedCount: unassigned,
        activeRepsCount: MOCK_REPS.filter((r) => r.status === "active").length,
        pipelineActiveValue: 42500,
        stageFunnel: [
          { stage: "New", count: MOCK_LEADS.filter((l) => l.status === "New").length },
          { stage: "Contacted", count: MOCK_LEADS.filter((l) => l.status === "Contacted").length },
          { stage: "In Negotiation", count: MOCK_LEADS.filter((l) => l.status === "In Negotiation").length },
          { stage: "Closed Won", count: MOCK_LEADS.filter((l) => l.status === "Closed Won").length },
          { stage: "Closed Lost", count: MOCK_LEADS.filter((l) => l.status === "Closed Lost").length },
        ],
        teamActivity: MOCK_REPS.map((r) => ({
          repId: r.id,
          repName: r.name,
          repInitials: r.avatarInitials,
          leadsHandled: r.assignedLeadsCount,
          closedWonCount: r.closedWonCount,
          conversionRate: r.conversionRate,
        })),
      });
    }, 300);
  });
}

export async function getClientLeads(params?: {
  status?: string;
  assignedRep?: string;
  search?: string;
}): Promise<DetailedLead[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...MOCK_LEADS];

      if (params?.status && params.status !== "all") {
        filtered = filtered.filter((l) => l.status === params.status);
      }
      if (params?.assignedRep) {
        if (params.assignedRep === "unassigned") {
          filtered = filtered.filter((l) => !l.assignedRepName);
        } else if (params.assignedRep !== "all") {
          filtered = filtered.filter((l) => l.assignedRepName === params.assignedRep);
        }
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.phone.includes(query) ||
            l.source.toLowerCase().includes(query)
        );
      }

      resolve(filtered);
    }, 300);
  });
}

export async function getUnassignedLeads(): Promise<DetailedLead[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_LEADS.filter((l) => !l.assignedRepName));
    }, 200);
  });
}

export async function getLeadById(id: string): Promise<DetailedLead | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = MOCK_LEADS.find((l) => l.id === id) || null;
      resolve(found);
    }, 200);
  });
}

export async function assignLead(leadId: string, repId: string): Promise<DetailedLead> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lead = MOCK_LEADS.find((l) => l.id === leadId);
      const rep = MOCK_REPS.find((r) => r.id === repId);

      if (!lead || !rep) {
        reject(new Error("Lead or Sales Rep not found"));
        return;
      }

      lead.assignedRepName = rep.name;
      lead.assignedRepInitials = rep.avatarInitials;
      lead.updatedAt = new Date().toISOString();
      lead.notes.unshift({
        id: `note_${Date.now()}`,
        authorName: "Client Admin",
        content: `Lead assigned to sales rep ${rep.name}`,
        timestamp: new Date().toISOString(),
      });

      rep.assignedLeadsCount += 1;
      resolve(lead);
    }, 300);
  });
}

export async function bulkAssignLeads(leadIds: string[], repId: string): Promise<{ success: boolean; count: number }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const rep = MOCK_REPS.find((r) => r.id === repId);
      if (!rep) {
        reject(new Error("Sales Rep not found"));
        return;
      }

      let count = 0;
      leadIds.forEach((id) => {
        const lead = MOCK_LEADS.find((l) => l.id === id);
        if (lead) {
          lead.assignedRepName = rep.name;
          lead.assignedRepInitials = rep.avatarInitials;
          lead.updatedAt = new Date().toISOString();
          count++;
        }
      });

      rep.assignedLeadsCount += count;
      resolve({ success: true, count });
    }, 400);
  });
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage,
  closedLostReason?: string
): Promise<DetailedLead> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lead = MOCK_LEADS.find((l) => l.id === leadId);
      if (!lead) {
        reject(new Error("Lead not found"));
        return;
      }

      const prevStage = lead.status;
      lead.status = stage;
      lead.updatedAt = new Date().toISOString();

      if (stage === "Closed Lost" && closedLostReason) {
        lead.closedLostReason = closedLostReason;
      }

      lead.notes.unshift({
        id: `note_${Date.now()}`,
        authorName: "Pipeline Action",
        content: `Stage updated from "${prevStage}" to "${stage}"${
          closedLostReason ? ` (Reason: ${closedLostReason})` : ""
        }`,
        timestamp: new Date().toISOString(),
      });

      resolve(lead);
    }, 300);
  });
}

export async function addLeadNote(leadId: string, input: AddNoteInput): Promise<DetailedLead> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lead = MOCK_LEADS.find((l) => l.id === leadId);
      if (!lead) {
        reject(new Error("Lead not found"));
        return;
      }

      const newNote = {
        id: `note_${Date.now()}`,
        authorName: "Client Admin",
        content: input.content,
        timestamp: new Date().toISOString(),
      };

      lead.notes.unshift(newNote);
      lead.updatedAt = new Date().toISOString();
      resolve(lead);
    }, 300);
  });
}

export async function getClientTeam(): Promise<SalesRep[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_REPS]);
    }, 300);
  });
}

export async function inviteRep(input: InviteRepInput): Promise<SalesRep> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initials = input.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

      const newRep: SalesRep = {
        id: `rep_${Math.random().toString(36).substring(2, 8)}`,
        name: input.name,
        email: input.email,
        status: input.sendInviteEmail ? "invited" : "active",
        assignedLeadsCount: 0,
        closedWonCount: 0,
        closedLostCount: 0,
        conversionRate: 0,
        avatarInitials: initials || "SR",
        joinedAt: new Date().toISOString(),
      };

      MOCK_REPS.unshift(newRep);
      resolve(newRep);
    }, 400);
  });
}

export async function removeRep(repId: string): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_REPS = MOCK_REPS.filter((r) => r.id !== repId);
      resolve({ success: true });
    }, 300);
  });
}

export async function getClientReports(): Promise<ClientReportData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        performanceOverTime: [
          { date: "Sep 18", leadsReceived: 12, closedWon: 3 },
          { date: "Sep 19", leadsReceived: 15, closedWon: 5 },
          { date: "Sep 20", leadsReceived: 10, closedWon: 2 },
          { date: "Sep 21", leadsReceived: 18, closedWon: 6 },
          { date: "Sep 22", leadsReceived: 14, closedWon: 4 },
          { date: "Sep 23", leadsReceived: 22, closedWon: 8 },
          { date: "Sep 24", leadsReceived: 16, closedWon: 5 },
        ],
        repPerformance: MOCK_REPS.map((r) => ({
          repId: r.id,
          repName: r.name,
          leadsHandled: r.assignedLeadsCount,
          closedWon: r.closedWonCount,
          closedLost: r.closedLostCount,
          conversionRate: r.conversionRate,
        })),
      });
    }, 300);
  });
}

export async function updateClientSettings(input: ClientSettingsInput): Promise<OrgSettings> {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_ORG_SETTINGS = {
        ...MOCK_ORG_SETTINGS,
        orgName: input.orgName,
        notifyOnNewLead: input.notifyOnNewLead,
        dailySummaryDigest: input.dailySummaryDigest,
        leadAssignmentMode: input.leadAssignmentMode,
      };
      resolve({ ...MOCK_ORG_SETTINGS });
    }, 300);
  });
}
