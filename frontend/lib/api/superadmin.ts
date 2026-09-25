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
import { Lead } from "@/components/shared/LeadCard";

// Mock Data Store for Super Admin
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
  {
    id: "cli_crest_103",
    name: "Crestview Real Estate",
    contactEmail: "info@crestviewre.com",
    contactPhone: "+1 (555) 345-6789",
    adminEmail: "emily@crestviewre.com",
    status: "active",
    leadCount: 215,
    lastActivityDate: "2026-09-24T18:00:00Z",
    createdAt: "2026-03-10T14:15:00Z",
    mappedPageCount: 4,
    repCount: 8,
  },
  {
    id: "cli_vanguard_104",
    name: "Vanguard Fitness",
    contactEmail: "hello@vanguardfit.com",
    contactPhone: "+1 (555) 456-7890",
    adminEmail: "mark@vanguardfit.com",
    status: "inactive",
    leadCount: 34,
    lastActivityDate: "2026-08-12T11:00:00Z",
    createdAt: "2026-04-05T08:00:00Z",
    mappedPageCount: 1,
    repCount: 2,
  },
];

let MOCK_MAPPINGS: MetaPageMapping[] = [
  {
    id: "map_1",
    pageId: "109823471092834",
    pageName: "Apex Design Official Facebook Page",
    adId: "ad_9823471",
    clientId: "cli_apex_101",
    clientName: "Apex Design Co.",
    createdAt: "2026-01-16T10:00:00Z",
  },
  {
    id: "map_2",
    pageId: "209847109283471",
    pageName: "Nexus Solar Promo Page",
    adId: "ad_1239847",
    clientId: "cli_nexus_102",
    clientName: "Nexus Solar Solutions",
    createdAt: "2026-02-02T11:30:00Z",
  },
  {
    id: "map_3",
    pageId: "309812739812739",
    pageName: "Crestview Luxury Homes Meta Lead Form",
    adId: "ad_4561238",
    clientId: "cli_crest_103",
    clientName: "Crestview Real Estate",
    createdAt: "2026-03-11T16:00:00Z",
  },
];

let MOCK_UNMATCHED: UnmatchedLead[] = [
  {
    id: "unmatched_1",
    rawPageId: "998877665544332",
    rawAdId: "ad_776655",
    leadName: "Jonathan Miller",
    leadPhone: "+1 (555) 888-1122",
    leadEmail: "jonathan@example.com",
    timestamp: "2026-09-24T17:10:00Z",
    payload: `{"form_id": "form_99", "page_id": "998877665544332", "field_data": [{"name": "full_name", "values": ["Jonathan Miller"]}]}`,
  },
  {
    id: "unmatched_2",
    rawPageId: "887766554433221",
    rawAdId: "ad_554433",
    leadName: "Amanda Rodriguez",
    leadPhone: "+1 (555) 777-3344",
    leadEmail: "amanda.r@example.com",
    timestamp: "2026-09-24T15:45:00Z",
    payload: `{"form_id": "form_88", "page_id": "887766554433221", "field_data": [{"name": "full_name", "values": ["Amanda Rodriguez"]}]}`,
  },
];

let MOCK_LOGS: MetaIntegrationStatus = {
  tokenStatus: "valid",
  tokenExpiresAt: "2027-03-31T23:59:59Z",
  lastWebhookTimestamp: "2026-09-24T18:02:15Z",
  metaConnectionHealthy: true,
  recentLogs: [
    {
      id: "log_1",
      timestamp: "2026-09-24T18:02:15Z",
      event: "leadgen_webhook_received",
      status: "success",
      pageId: "109823471092834",
      details: "Matched to Apex Design Co. -> Lead created ID lead_901",
    },
    {
      id: "log_2",
      timestamp: "2026-09-24T17:10:00Z",
      event: "leadgen_webhook_received",
      status: "failure",
      pageId: "998877665544332",
      details: "No client mapping found for Page ID 998877665544332 -> Sent to Unmatched Inbox",
    },
    {
      id: "log_3",
      timestamp: "2026-09-24T16:20:00Z",
      event: "leadgen_webhook_received",
      status: "success",
      pageId: "209847109283471",
      details: "Matched to Nexus Solar Solutions -> Lead created ID lead_902",
    },
  ],
};

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
  {
    id: "usr_client_2",
    name: "David Chen",
    email: "david@nexussolar.io",
    clientId: "cli_nexus_102",
    clientName: "Nexus Solar Solutions",
    status: "active",
    lastLogin: "2026-09-24T16:20:00Z",
    createdAt: "2026-02-01T10:30:00Z",
  },
  {
    id: "usr_client_3",
    name: "Emily Watson",
    email: "emily@crestviewre.com",
    clientId: "cli_crest_103",
    clientName: "Crestview Real Estate",
    status: "active",
    lastLogin: "2026-09-24T18:00:00Z",
    createdAt: "2026-03-10T14:15:00Z",
  },
];

// --- Super Admin API Methods ---

export async function getSuperAdminDashboardSummary(): Promise<SuperAdminDashboardSummary> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalLeadsToday: 42,
        totalLeadsWeek: 284,
        totalLeadsMonth: 1250,
        activeClientsCount: MOCK_CLIENTS.filter((c) => c.status === "active").length,
        totalAdSpendMonth: 18450,
        systemStatus: {
          metaConnection: MOCK_LOGS.metaConnectionHealthy ? "healthy" : "down",
          lastChecked: MOCK_LOGS.lastWebhookTimestamp,
        },
        leadsOverTime: [
          { date: "Sep 18", leads: 32 },
          { date: "Sep 19", leads: 45 },
          { date: "Sep 20", leads: 38 },
          { date: "Sep 21", leads: 52 },
          { date: "Sep 22", leads: 41 },
          { date: "Sep 23", leads: 58 },
          { date: "Sep 24", leads: 42 },
        ],
        recentActivity: [
          {
            id: "act_1",
            clientName: "Apex Design Co.",
            action: "New Meta lead received from Campaign #402",
            timestamp: "10 mins ago",
            type: "lead",
          },
          {
            id: "act_2",
            clientName: "Nexus Solar Solutions",
            action: "Client admin added 2 new sales reps",
            timestamp: "1 hour ago",
            type: "client",
          },
          {
            id: "act_3",
            clientName: "System",
            action: "Meta System User Token health check passed",
            timestamp: "3 hours ago",
            type: "system",
          },
        ],
      });
    }, 300);
  });
}

export async function getClients(params?: { search?: string; status?: string }): Promise<ClientOrg[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...MOCK_CLIENTS];
      if (params?.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (c) => c.name.toLowerCase().includes(query) || c.adminEmail.toLowerCase().includes(query)
        );
      }
      if (params?.status && params.status !== "all") {
        filtered = filtered.filter((c) => c.status === params.status);
      }
      resolve(filtered);
    }, 300);
  });
}

export async function getClientById(id: string): Promise<ClientOrg | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const client = MOCK_CLIENTS.find((c) => c.id === id) || null;
      resolve(client);
    }, 200);
  });
}

export async function createClient(
  input: AddClientInput
): Promise<{ client: ClientOrg; generatedPassword?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const generatedPassword = input.autoGeneratePassword
        ? `MB-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`
        : input.password || "Password123!";

      const newClient: ClientOrg = {
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

      MOCK_CLIENTS.unshift(newClient);

      // Add corresponding Client Admin User
      MOCK_CLIENT_ADMINS.unshift({
        id: `usr_${Math.random().toString(36).substring(2, 8)}`,
        name: `${input.name} Admin`,
        email: input.adminEmail,
        clientId: newClient.id,
        clientName: newClient.name,
        status: "active",
        lastLogin: "Never",
        createdAt: new Date().toISOString(),
      });

      resolve({ client: newClient, generatedPassword });
    }, 400);
  });
}

export async function updateClient(id: string, input: EditClientInput): Promise<ClientOrg> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = MOCK_CLIENTS.findIndex((c) => c.id === id);
      if (index === -1) {
        reject(new Error("Client not found"));
        return;
      }

      MOCK_CLIENTS[index] = {
        ...MOCK_CLIENTS[index],
        name: input.name,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: input.status,
      };

      resolve(MOCK_CLIENTS[index]);
    }, 300);
  });
}

export async function deactivateClient(id: string): Promise<ClientOrg> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = MOCK_CLIENTS.findIndex((c) => c.id === id);
      if (index === -1) {
        reject(new Error("Client not found"));
        return;
      }
      MOCK_CLIENTS[index].status = MOCK_CLIENTS[index].status === "active" ? "inactive" : "active";
      resolve(MOCK_CLIENTS[index]);
    }, 300);
  });
}

export async function getMetaMappings(): Promise<MetaPageMapping[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_MAPPINGS]);
    }, 300);
  });
}

export async function createMetaMapping(input: AddMappingInput): Promise<MetaPageMapping> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const client = MOCK_CLIENTS.find((c) => c.id === input.clientId);
      if (!client) {
        reject(new Error("Client organization not found"));
        return;
      }

      const newMapping: MetaPageMapping = {
        id: `map_${Math.random().toString(36).substring(2, 8)}`,
        pageId: input.pageId,
        pageName: input.pageName,
        adId: input.adId,
        clientId: client.id,
        clientName: client.name,
        createdAt: new Date().toISOString(),
      };

      MOCK_MAPPINGS.unshift(newMapping);
      client.mappedPageCount += 1;
      resolve(newMapping);
    }, 300);
  });
}

export async function deleteMetaMapping(id: string): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_MAPPINGS = MOCK_MAPPINGS.filter((m) => m.id !== id);
      resolve({ success: true });
    }, 300);
  });
}

export async function getUnmatchedLeads(): Promise<UnmatchedLead[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_UNMATCHED]);
    }, 300);
  });
}

export async function manualAssignUnmatchedLead(
  leadId: string,
  clientId: string
): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const client = MOCK_CLIENTS.find((c) => c.id === clientId);
      if (!client) {
        reject(new Error("Client organization not found"));
        return;
      }

      MOCK_UNMATCHED = MOCK_UNMATCHED.filter((l) => l.id !== leadId);
      client.leadCount += 1;
      resolve({ success: true });
    }, 300);
  });
}

export async function getMetaIntegrationStatus(): Promise<MetaIntegrationStatus> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...MOCK_LOGS });
    }, 300);
  });
}

export async function sendTestLeadSimulation(): Promise<{ success: boolean; leadId: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newLeadId = `lead_test_${Math.floor(Math.random() * 1000)}`;
      MOCK_LOGS.lastWebhookTimestamp = new Date().toISOString();
      MOCK_LOGS.recentLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: "test_lead_simulation",
        status: "success",
        pageId: "109823471092834",
        details: `Simulated test lead created cleanly -> ${newLeadId}`,
      });
      resolve({ success: true, leadId: newLeadId });
    }, 500);
  });
}

export async function getClientAdmins(): Promise<ClientAdminUser[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_CLIENT_ADMINS]);
    }, 300);
  });
}

export async function resetClientAdminPassword(id: string): Promise<{ success: boolean; resetLink: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        resetLink: `https://marketbytes.crm/forgot-password/reset?token=rst_${id}`,
      });
    }, 300);
  });
}

export async function toggleClientAdminStatus(id: string): Promise<ClientAdminUser> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_CLIENT_ADMINS.find((u) => u.id === id);
      if (!user) {
        reject(new Error("User not found"));
        return;
      }
      user.status = user.status === "active" ? "inactive" : "active";
      resolve(user);
    }, 300);
  });
}

export async function getSuperAdminReports(): Promise<SuperAdminReportData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        leadsByClient: MOCK_CLIENTS.map((c) => ({
          clientName: c.name,
          leads: c.leadCount,
        })),
        conversionByClient: MOCK_CLIENTS.map((c) => {
          const won = Math.floor(c.leadCount * 0.28);
          const lost = Math.floor(c.leadCount * 0.15);
          return {
            clientId: c.id,
            clientName: c.name,
            totalLeads: c.leadCount,
            closedWon: won,
            closedLost: lost,
            conversionRate: Math.round((won / (c.leadCount || 1)) * 100),
          };
        }),
      });
    }, 300);
  });
}
