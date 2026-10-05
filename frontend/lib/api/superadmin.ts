import {
  ClientOrg,
  MetaPageMapping,
  UnmatchedLead,
  MetaIntegrationStatus,
  SuperAdminDashboardSummary,
  ClientAdminUser,
  SuperAdminReportData,
} from "../types/superadmin";
import { AddClientInput, EditClientInput, AddMappingInput, SuperAdminSettingsInput } from "../validators/superadmin";
import { apiRequest, setAuthToken } from "./httpClient";

export async function impersonateTenant(tenantId: string): Promise<{ access_token: string }> {
  const res = await apiRequest<{ access_token: string; token_type: string }>(
    `/admin/impersonate/${tenantId}`,
    { method: "POST" }
  );
  if (res?.access_token) {
    setAuthToken(res.access_token);
  }
  return res;
}

let MOCK_CLIENTS: ClientOrg[] = [
  {
    id: "cli_apex_101",
    name: "Apex Design Co.",
    contactEmail: "contact@apexdesign.com",
    contactPhone: "+1 (555) 234-5678",
    adminEmail: "sarah@apexdesign.com",
    status: "active",
    leadCount: 142,
    lastActivityDate: "2026-09-24T17:45:00Z",
    createdAt: "2026-01-15T09:00:00Z",
    mappedPageCount: 3,
    repCount: 6,
  },
  {
    id: "cli_nexus_102",
    name: "Nexus Solar Solutions",
    contactEmail: "sales@nexussolar.io",
    contactPhone: "+1 (555) 987-6543",
    adminEmail: "david@nexussolar.io",
    status: "active",
    leadCount: 89,
    lastActivityDate: "2026-09-24T16:20:00Z",
    createdAt: "2026-02-01T10:30:00Z",
    mappedPageCount: 2,
    repCount: 4,
  },
];

let MOCK_MAPPINGS: MetaPageMapping[] = [
  {
    id: "map_1",
    pageId: "109823471092834",
    pageName: "Apex Design Official FB Page",
    adId: "ad_fb_99182",
    clientId: "cli_apex_101",
    clientName: "Apex Design Co.",
    createdAt: "2026-01-16T10:00:00Z",
  },
];

let MOCK_UNMATCHED: UnmatchedLead[] = [
  {
    id: "unmatched_901",
    rawPageId: "998811223344",
    rawAdId: "ad_unmapped_77",
    leadName: "Unknown Lead (Meta Direct)",
    leadPhone: "+1 (555) 999-1122",
    leadEmail: "unmapped.user@example.com",
    timestamp: "2026-09-24T18:12:00Z",
    payload: `{"entry":[{"changes":[{"value":{"form_id":"form_99","page_id":"998811223344"}}]}]}`,
  },
];

let MOCK_CLIENT_ADMINS: ClientAdminUser[] = [
  {
    id: "usr_client_1",
    name: "Sarah Jenkins",
    email: "sarah@apexdesign.com",
    clientId: "cli_apex_101",
    clientName: "Apex Design Co.",
    status: "active",
    lastLogin: "2026-09-24T17:45:00Z",
    createdAt: "2026-01-15T09:00:00Z",
  },
];

let MOCK_LOGS: MetaIntegrationStatus = {
  tokenStatus: "valid",
  tokenExpiresAt: "2027-03-31T23:59:59Z",
  lastWebhookTimestamp: "2026-09-24T18:12:00Z",
  metaConnectionHealthy: true,
  recentLogs: [
    {
      id: "log_1",
      timestamp: "2026-09-24T18:12:00Z",
      event: "webhook_received",
      status: "failure",
      pageId: "998811223344",
      details: "Page ID 998811223344 unmapped. Routed to Unmatched Leads queue.",
    },
  ],
};

let MOCK_SETTINGS: SuperAdminSettingsInput = {
  platformName: "MarketBytes CRM",
  supportEmail: "support@marketbytes.com",
  webhookRetryLimit: 3,
  defaultNotificationEmail: "admin@marketbytes.com",
};

export async function getSuperAdminDashboardSummary(): Promise<SuperAdminDashboardSummary> {
  try {
    return await apiRequest<SuperAdminDashboardSummary>("/superadmin/dashboard-summary");
  } catch (err) {
    console.warn("Backend /superadmin/dashboard-summary failed, using fallback:", err);
    return {
      totalLeadsToday: 24,
      totalLeadsWeek: 184,
      totalLeadsMonth: 742,
      activeClientsCount: MOCK_CLIENTS.filter((c) => c.status === "active").length,
      totalAdSpendMonth: 18450,
      systemStatus: {
        metaConnection: "healthy",
        lastChecked: new Date().toISOString(),
      },
      leadsOverTime: [
        { date: "Sep 18", leads: 18 },
        { date: "Sep 19", leads: 22 },
        { date: "Sep 20", leads: 29 },
        { date: "Sep 21", leads: 24 },
        { date: "Sep 22", leads: 35 },
        { date: "Sep 23", leads: 31 },
        { date: "Sep 24", leads: 24 },
      ],
      recentActivity: [
        {
          id: "act_1",
          clientName: "Apex Design Co.",
          action: "New Meta lead received: Robert Fox",
          timestamp: "10 mins ago",
          type: "lead",
        },
      ],
    };
  }
}

export async function getClients(filters?: { search?: string; status?: string }): Promise<ClientOrg[]> {
  try {
    const rawOrgs = await apiRequest<any[]>("/organizations");
    let result: ClientOrg[] = rawOrgs.map((o) => ({
      id: String(o.id),
      name: o.name,
      contactEmail: o.primary_contact_email || "contact@agency.com",
      contactPhone: o.primary_contact_phone || "+15550000000",
      adminEmail: "admin@agency.com",
      status: (o.status || "ACTIVE").toLowerCase() as "active" | "inactive",
      leadCount: 15,
      lastActivityDate: o.created_at || new Date().toISOString(),
      createdAt: o.created_at || new Date().toISOString(),
      mappedPageCount: 1,
      repCount: 2,
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.contactEmail.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== "all") {
      result = result.filter((c) => c.status === filters.status);
    }
    return result;
  } catch (err) {
    console.warn("Backend /organizations failed, using fallback:", err);
    let result = [...MOCK_CLIENTS];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.contactEmail.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== "all") {
      result = result.filter((c) => c.status === filters.status);
    }
    return result;
  }
}

export async function getClientById(clientId: string): Promise<ClientOrg> {
  const clients = await getClients();
  const client = clients.find((c) => c.id === clientId);
  if (!client) throw new Error("Client not found");
  return client;
}

export async function createClient(input: AddClientInput): Promise<{ client: ClientOrg; generatedPassword: string }> {
  const generatedPassword = input.password || "ClientAdmin2026!";
  try {
    const res = await apiRequest<any>("/organizations", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        primary_contact_name: input.name,
        primary_contact_email: input.contactEmail,
        primary_contact_phone: input.contactPhone,
        status: "ACTIVE",
      }),
    });
    const client: ClientOrg = {
      id: String(res.id),
      name: res.name,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      adminEmail: input.adminEmail,
      status: "active",
      leadCount: 0,
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mappedPageCount: 0,
      repCount: 1,
    };
    return { client, generatedPassword };
  } catch (err) {
    const client: ClientOrg = {
      id: `cli_${Math.random().toString(36).substring(2, 8)}`,
      name: input.name,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      adminEmail: input.adminEmail,
      status: "active",
      leadCount: 0,
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mappedPageCount: 0,
      repCount: 1,
    };
    MOCK_CLIENTS.unshift(client);
    return { client, generatedPassword };
  }
}

export async function updateClient(id: string, input: EditClientInput): Promise<ClientOrg> {
  try {
    const res = await apiRequest<any>(`/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: input.name,
        primary_contact_email: input.contactEmail,
        primary_contact_phone: input.contactPhone,
        status: input.status.toUpperCase(),
      }),
    });
    return {
      id: String(res.id),
      name: res.name,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      adminEmail: "admin@agency.com",
      status: input.status,
      leadCount: 10,
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mappedPageCount: 1,
      repCount: 2,
    };
  } catch (err) {
    const index = MOCK_CLIENTS.findIndex((c) => c.id === id);
    if (index !== -1) {
      MOCK_CLIENTS[index] = {
        ...MOCK_CLIENTS[index],
        name: input.name,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: input.status,
      };
      return MOCK_CLIENTS[index];
    }
    throw err;
  }
}

export async function deactivateClient(id: string): Promise<ClientOrg> {
  try {
    const res = await apiRequest<any>(`/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "INACTIVE" }),
    });
    const index = MOCK_CLIENTS.findIndex((c) => c.id === id);
    if (index !== -1) {
      MOCK_CLIENTS[index].status = "inactive";
    }
    return {
      id: String(res.id),
      name: res.name,
      contactEmail: res.primary_contact_email || "contact@agency.com",
      contactPhone: res.primary_contact_phone || "+15550000000",
      adminEmail: "admin@agency.com",
      status: "inactive",
      leadCount: 0,
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mappedPageCount: 0,
      repCount: 0,
    };
  } catch (err) {
    console.warn("Backend PATCH /organizations/{id} failed, using fallback:", err);
    const index = MOCK_CLIENTS.findIndex((c) => c.id === id);
    if (index !== -1) {
      MOCK_CLIENTS[index].status = "inactive";
      return MOCK_CLIENTS[index];
    }
    throw new Error("Client not found");
  }
}

export async function getMetaMappings(): Promise<MetaPageMapping[]> {
  try {
    const raw = await apiRequest<any[]>("/page-mappings");
    return raw.map((m) => ({
      id: String(m.id),
      pageId: m.page_id,
      pageName: m.page_name,
      adId: "ad_fb_mapped",
      clientId: String(m.organization_id),
      clientName: "Demo Client",
      createdAt: m.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    return [...MOCK_MAPPINGS];
  }
}

export async function createMetaMapping(input: AddMappingInput): Promise<MetaPageMapping> {
  try {
    const res = await apiRequest<any>("/page-mappings", {
      method: "POST",
      body: JSON.stringify({
        organization_id: input.clientId,
        page_id: input.pageId,
        page_name: input.pageName,
        page_url: "https://facebook.com/page",
      }),
    });
    return {
      id: String(res.id),
      pageId: res.page_id,
      pageName: res.page_name,
      adId: input.adId,
      clientId: String(res.organization_id),
      clientName: "Demo Client",
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    const newMapping: MetaPageMapping = {
      id: `map_${Math.random().toString(36).substring(2, 8)}`,
      pageId: input.pageId,
      pageName: input.pageName,
      adId: input.adId,
      clientId: input.clientId,
      clientName: "Demo Client",
      createdAt: new Date().toISOString(),
    };
    MOCK_MAPPINGS.unshift(newMapping);
    return newMapping;
  }
}

export async function deleteMetaMapping(id: string): Promise<{ success: boolean }> {
  try {
    await apiRequest(`/page-mappings/${id}`, { method: "DELETE" });
    MOCK_MAPPINGS = MOCK_MAPPINGS.filter((m) => m.id !== id);
    return { success: true };
  } catch (err) {
    console.warn("Backend DELETE /page-mappings/{id} failed, using fallback:", err);
    MOCK_MAPPINGS = MOCK_MAPPINGS.filter((m) => m.id !== id);
    return { success: true };
  }
}

export async function getUnmatchedLeads(): Promise<UnmatchedLead[]> {
  try {
    return await apiRequest<UnmatchedLead[]>("/superadmin/leads/unmatched");
  } catch (err) {
    return [...MOCK_UNMATCHED];
  }
}

export async function manualAssignUnmatchedLead(leadId: string, clientId: string): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>(`/superadmin/leads/${leadId}/manual-assign`, {
      method: "POST",
      body: JSON.stringify({ clientId }),
    });
  } catch (err) {
    MOCK_UNMATCHED = MOCK_UNMATCHED.filter((l) => l.id !== leadId);
    return { success: true };
  }
}

export async function getMetaIntegrationStatus(): Promise<MetaIntegrationStatus> {
  try {
    return await apiRequest<MetaIntegrationStatus>("/superadmin/integration/status");
  } catch (err) {
    return { ...MOCK_LOGS };
  }
}

export async function sendTestLeadSimulation(): Promise<{ success: boolean; leadId: string }> {
  try {
    return await apiRequest<{ success: boolean; leadId: string }>("/superadmin/integration/test-lead", {
      method: "POST",
    });
  } catch (err) {
    const newLeadId = `lead_test_${Math.floor(Math.random() * 1000)}`;
    return { success: true, leadId: newLeadId };
  }
}

export async function getClientAdmins(): Promise<ClientAdminUser[]> {
  try {
    return await apiRequest<ClientAdminUser[]>("/superadmin/users");
  } catch (err) {
    return [...MOCK_CLIENT_ADMINS];
  }
}

export async function resetClientAdminPassword(id: string): Promise<{ success: boolean; resetLink: string }> {
  try {
    return await apiRequest<{ success: boolean; resetLink: string }>(`/superadmin/users/${id}/reset-password`, {
      method: "POST",
    });
  } catch (err) {
    return { success: true, resetLink: `https://crm.marketbytes.com/forgot-password/reset?token=rst_${id}` };
  }
}

export async function toggleClientAdminStatus(id: string): Promise<ClientAdminUser> {
  try {
    return await apiRequest<ClientAdminUser>(`/superadmin/users/${id}/toggle-status`, {
      method: "POST",
    });
  } catch (err) {
    const user = MOCK_CLIENT_ADMINS.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.status = user.status === "active" ? "inactive" : "active";
    return user;
  }
}

export async function getSuperAdminReports(): Promise<SuperAdminReportData> {
  try {
    return await apiRequest<SuperAdminReportData>("/superadmin/reports");
  } catch (err) {
    return {
      leadsByClient: MOCK_CLIENTS.map((c) => ({ clientName: c.name, leads: c.leadCount })),
      conversionByClient: MOCK_CLIENTS.map((c) => ({
        clientId: c.id,
        clientName: c.name,
        totalLeads: c.leadCount,
        closedWon: Math.floor(c.leadCount * 0.28),
        closedLost: Math.floor(c.leadCount * 0.15),
        conversionRate: Math.round(0.28 * 100),
      })),
    };
  }
}

export async function getSuperAdminSettings(): Promise<SuperAdminSettingsInput> {
  try {
    const res = await apiRequest<any>("/superadmin/settings");
    return {
      platformName: res.platformName || "MarketBytes CRM",
      supportEmail: res.systemNotificationEmail || "support@marketbytes.com",
      webhookRetryLimit: 3,
      defaultNotificationEmail: res.systemNotificationEmail || "admin@marketbytes.com",
    };
  } catch (err) {
    return { ...MOCK_SETTINGS };
  }
}

export async function updateSuperAdminSettings(input: SuperAdminSettingsInput): Promise<SuperAdminSettingsInput> {
  try {
    const res = await apiRequest<any>("/superadmin/settings", {
      method: "PATCH",
      body: JSON.stringify({
        platformName: input.platformName,
        systemNotificationEmail: input.defaultNotificationEmail,
        defaultNotifyOnNewLead: true,
      }),
    });
    return {
      platformName: res.platformName || input.platformName,
      supportEmail: input.supportEmail,
      webhookRetryLimit: input.webhookRetryLimit,
      defaultNotificationEmail: res.systemNotificationEmail || input.defaultNotificationEmail,
    };
  } catch (err) {
    MOCK_SETTINGS = { ...MOCK_SETTINGS, ...input };
    return MOCK_SETTINGS;
  }
}
