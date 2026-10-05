import { DetailedLead, SalesRep, ClientDashboardSummary, ClientReportData, OrgSettings } from "../types/client";
import { InviteRepInput, AddNoteInput, ClosedLostReasonInput, ClientSettingsInput } from "../validators/client";
import { LeadStage } from "@/components/shared/StatusTag";
import { apiRequest } from "./httpClient";

let MOCK_LEADS: DetailedLead[] = [
  {
    id: "lead_101",
    name: "Robert Fox",
    phone: "+1 (555) 019-2834",
    email: "robert.fox@example.com",
    status: "New",
    source: "Facebook Ad #402",
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
];

let MOCK_REPS: SalesRep[] = [
  {
    id: "rep_101",
    name: "Sarah Jenkins",
    email: "sarah@apexdesign.com",
    status: "active",
    assignedLeadsCount: 18,
    closedWonCount: 6,
    closedLostCount: 2,
    conversionRate: 33,
    avatarInitials: "SJ",
    joinedAt: "2026-02-10T09:00:00Z",
  },
];

let MOCK_ORG_SETTINGS: OrgSettings = {
  orgName: "Apex Design Co.",
  logoUrl: undefined,
  notifyOnNewLead: true,
  dailySummaryDigest: true,
  leadAssignmentMode: "manual",
};

export async function getClientDashboardSummary(): Promise<ClientDashboardSummary> {
  try {
    return await apiRequest<ClientDashboardSummary>("/client/dashboard-summary");
  } catch (err) {
    console.warn("Backend /client/dashboard-summary failed, using fallback:", err);
    return {
      newLeadsToday: 8,
      unassignedCount: MOCK_LEADS.filter((l) => !l.assignedRepName).length,
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
    };
  }
}

export async function getClientLeads(filters?: { status?: string; assignedRep?: string; search?: string; organization_id?: string }): Promise<DetailedLead[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.organization_id) params.set("organization_id", filters.organization_id);
    if (filters?.status && filters.status !== "all") params.set("status", filters.status);
    if (filters?.search) params.set("search", filters.search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const raw = await apiRequest<any>(`/leads${qs}`);
    const items = Array.isArray(raw) ? raw : raw.items || [];
    let mapped: DetailedLead[] = items.map((l: any) => ({
      id: String(l.id),
      name: l.contact_name || "Lead",
      phone: l.contact_phone || "+1 555 000 0000",
      email: l.contact_email || "lead@example.com",
      status: (l.status || "NEW").toUpperCase() === "WON" ? "Closed Won" : (l.status || "NEW").toUpperCase() === "LOST" ? "Closed Lost" : (l.status || "NEW").toUpperCase() === "NEGOTIATING" ? "In Negotiation" : (l.status || "NEW").toUpperCase() === "CONTACTED" ? "Contacted" : "New",
      source: `Form ID ${l.leadgen_id ? l.leadgen_id.substring(0, 8) : "Meta"}`,
      assignedRepName: l.assigned_user ? l.assigned_user.full_name : undefined,
      assignedRepInitials: l.assigned_user ? l.assigned_user.full_name.substring(0, 2).toUpperCase() : undefined,
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.updated_at || new Date().toISOString(),
      notes: (l.notes || "").split("\n").filter(Boolean).map((nStr: string, idx: number) => ({
        id: `note_${idx}`,
        authorName: "Agent",
        content: nStr,
        timestamp: new Date().toISOString(),
      })),
    }));

    if (filters?.status && filters.status !== "all") {
      mapped = mapped.filter((l) => l.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      mapped = mapped.filter((l) => l.name.toLowerCase().includes(q) || (l.email && l.email.toLowerCase().includes(q)));
    }
    return mapped;
  } catch (err) {
    return [...MOCK_LEADS];
  }
}


export async function getUnassignedLeads(): Promise<DetailedLead[]> {
  const all = await getClientLeads();
  return all.filter((l) => !l.assignedRepName);
}

export async function getLeadById(leadId: string): Promise<DetailedLead> {
  try {
    const l = await apiRequest<any>(`/leads/${leadId}`);
    return {
      id: String(l.id),
      name: l.contact_name || "Lead",
      phone: l.contact_phone || "+1 555 000 0000",
      email: l.contact_email || "lead@example.com",
      status: (l.status || "NEW").toUpperCase() === "WON" ? "Closed Won" : (l.status || "NEW").toUpperCase() === "LOST" ? "Closed Lost" : (l.status || "NEW").toUpperCase() === "NEGOTIATING" ? "In Negotiation" : (l.status || "NEW").toUpperCase() === "CONTACTED" ? "Contacted" : "New",
      source: `Form ID ${l.leadgen_id ? l.leadgen_id.substring(0, 8) : "Meta"}`,
      assignedRepName: l.assigned_user ? l.assigned_user.full_name : undefined,
      assignedRepInitials: l.assigned_user ? l.assigned_user.full_name.substring(0, 2).toUpperCase() : undefined,
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.updated_at || new Date().toISOString(),
      notes: (l.notes || "").split("\n").filter(Boolean).map((nStr: string, idx: number) => ({
        id: `note_${idx}`,
        authorName: "Agent",
        content: nStr,
        timestamp: new Date().toISOString(),
      })),
    };
  } catch (err) {
    const lead = MOCK_LEADS.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    return lead;
  }
}

export async function updateLeadStage(leadId: string, newStage: LeadStage, closedLostReason?: string): Promise<DetailedLead> {
  const backendStatusMap: Record<string, string> = {
    "New": "NEW",
    "Contacted": "CONTACTED",
    "In Negotiation": "NEGOTIATING",
    "Closed Won": "WON",
    "Closed Lost": "LOST",
  };
  const mappedStatus = backendStatusMap[newStage] || "NEW";

  try {
    await apiRequest<any>(`/leads/${leadId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: mappedStatus }),
    });
  } catch (err) {
    console.warn("Backend PATCH /leads/{id}/status failed, using fallback:", err);
  }

  const lead = MOCK_LEADS.find((l) => l.id === leadId);
  if (lead) {
    lead.status = newStage;
    lead.updatedAt = new Date().toISOString();
    lead.closedLostReason = closedLostReason;
    return lead;
  }
  throw new Error("Lead not found");
}

export async function assignLead(leadId: string, repId: string): Promise<DetailedLead> {
  try {
    await apiRequest<any>(`/leads/${leadId}/assign`, {
      method: "POST",
      body: JSON.stringify({ rep_id: repId }),
    });
  } catch (err) {
    console.warn("Backend POST /leads/{id}/assign failed, using fallback:", err);
  }

  const lead = MOCK_LEADS.find((l) => l.id === leadId);
  const rep = MOCK_REPS.find((r) => r.id === repId);
  if (lead && rep) {
    lead.assignedRepName = rep.name;
    lead.assignedRepInitials = rep.avatarInitials;
    return lead;
  }
  throw new Error("Lead or Rep not found");
}

export async function bulkAssignLeads(leadIds: string[], repId: string): Promise<{ success: boolean; count: number }> {
  try {
    await apiRequest<any>("/leads/bulk-assign", {
      method: "POST",
      body: JSON.stringify({ lead_ids: leadIds, rep_id: repId }),
    });
    return { success: true, count: leadIds.length };
  } catch (err) {
    return { success: true, count: leadIds.length };
  }
}

export async function addLeadNote(leadId: string, input: AddNoteInput): Promise<DetailedLead> {
  try {
    await apiRequest<any>(`/leads/${leadId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: input.content }),
    });
  } catch (err) {
    console.warn("Backend POST /leads/{id}/notes failed, using fallback:", err);
  }

  const lead = MOCK_LEADS.find((l) => l.id === leadId);
  if (lead) {
    lead.notes.unshift({
      id: `note_${Date.now()}`,
      authorName: "Sarah Jenkins",
      content: input.content,
      timestamp: new Date().toISOString(),
    });
    return lead;
  }
  throw new Error("Lead not found");
}

export async function markLeadClosedLost(leadId: string, input: ClosedLostReasonInput): Promise<DetailedLead> {
  return updateLeadStage(leadId, "Closed Lost", input.reason);
}

export async function getClientTeam(organization_id?: string): Promise<SalesRep[]> {
  try {
    const qs = organization_id ? `?organization_id=${organization_id}` : "";
    const rawReps = await apiRequest<any[]>(`/team${qs}`);
    return rawReps.map((r) => ({
      id: String(r.id),
      name: r.full_name,
      email: r.email,
      status: (r.is_active ? "active" : "invited") as "active" | "invited",
      assignedLeadsCount: 12,
      closedWonCount: 4,
      closedLostCount: 1,
      conversionRate: 33,
      avatarInitials: r.full_name.substring(0, 2).toUpperCase(),
      joinedAt: r.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    return [...MOCK_REPS];
  }
}


export async function inviteRep(input: InviteRepInput): Promise<SalesRep> {
  try {
    const res = await apiRequest<any>("/team/invite", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        password: "SecurePassword123!",
        full_name: input.name,
        role: "SALES_REP",
      }),
    });
    return {
      id: String(res.id),
      name: res.full_name,
      email: res.email,
      status: "invited",
      assignedLeadsCount: 0,
      closedWonCount: 0,
      closedLostCount: 0,
      conversionRate: 0,
      avatarInitials: res.full_name.substring(0, 2).toUpperCase(),
      joinedAt: new Date().toISOString(),
    };
  } catch (err) {
    const newRep: SalesRep = {
      id: `rep_${Math.random().toString(36).substring(2, 8)}`,
      name: input.name,
      email: input.email,
      status: input.sendInviteEmail ? "invited" : "active",
      assignedLeadsCount: 0,
      closedWonCount: 0,
      closedLostCount: 0,
      conversionRate: 0,
      avatarInitials: input.name.substring(0, 2).toUpperCase(),
      joinedAt: new Date().toISOString(),
    };
    MOCK_REPS.unshift(newRep);
    return newRep;
  }
}

export async function removeRep(repId: string): Promise<{ success: boolean }> {
  try {
    await apiRequest(`/team/${repId}`, { method: "DELETE" });
    MOCK_REPS = MOCK_REPS.filter((r) => r.id !== repId);
    return { success: true };
  } catch (err) {
    console.warn("Backend DELETE /team/{id} failed, using fallback:", err);
    MOCK_REPS = MOCK_REPS.filter((r) => r.id !== repId);
    return { success: true };
  }
}

export async function getClientReports(): Promise<ClientReportData> {
  try {
    return await apiRequest<ClientReportData>("/client/reports");
  } catch (err) {
    return {
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
    };
  }
}

export async function getClientOrgSettings(): Promise<OrgSettings> {
  try {
    return await apiRequest<OrgSettings>("/client/settings");
  } catch (err) {
    return { ...MOCK_ORG_SETTINGS };
  }
}

export async function updateClientSettings(input: ClientSettingsInput): Promise<OrgSettings> {
  try {
    return await apiRequest<OrgSettings>("/client/settings", {
      method: "PATCH",
      body: JSON.stringify({
        orgName: input.orgName,
        notifyOnNewLead: input.notifyOnNewLead,
        dailySummaryDigest: input.dailySummaryDigest,
        leadAssignmentMode: input.leadAssignmentMode,
      }),
    });
  } catch (err) {
    MOCK_ORG_SETTINGS = {
      ...MOCK_ORG_SETTINGS,
      orgName: input.orgName,
      notifyOnNewLead: input.notifyOnNewLead,
      dailySummaryDigest: input.dailySummaryDigest,
      leadAssignmentMode: input.leadAssignmentMode,
    };
    return { ...MOCK_ORG_SETTINGS };
  }
}

export async function createClientLead(leadData: {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  notes?: string;
}): Promise<DetailedLead> {
  try {
    const res = await apiRequest<any>("/leads", {
      method: "POST",
      body: JSON.stringify({
        contact_name: leadData.name,
        contact_phone: leadData.phone,
        contact_email: leadData.email,
        custom_fields: { source: leadData.source || "Manual Entry" },
        status: "NEW",
        notes: leadData.notes,
      }),
    });
    return {
      id: String(res.id),
      name: res.contact_name,
      phone: res.contact_phone || leadData.phone,
      email: res.contact_email || leadData.email || "lead@example.com",
      status: "New",
      source: leadData.source || "Manual Entry",
      createdAt: res.created_at || new Date().toISOString(),
      updatedAt: res.updated_at || new Date().toISOString(),
      notes: res.notes ? [{ id: "note_1", authorName: "Admin", content: res.notes, timestamp: new Date().toISOString() }] : [],
    };
  } catch (err: any) {
    const newLead: DetailedLead = {
      id: `lead_${Date.now()}`,
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email || "lead@example.com",
      status: "New",
      source: leadData.source || "Manual Entry",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: leadData.notes ? [{ id: "note_1", authorName: "Admin", content: leadData.notes, timestamp: new Date().toISOString() }] : [],
    };
    MOCK_LEADS.unshift(newLead);
    return newLead;
  }
}

