from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any

# ==================== ORGANIZATIONS ====================
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Client Company Name")
    primary_contact_name: str | None = None
    primary_contact_phone: str | None = None
    primary_contact_email: str | None = None
    status: str = "ACTIVE"

class OrganizationUpdate(BaseModel):
    name: str | None = None
    primary_contact_name: str | None = None
    primary_contact_phone: str | None = None
    primary_contact_email: str | None = None
    status: str | None = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    primary_contact_name: str | None = None
    primary_contact_phone: str | None = None
    primary_contact_email: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== PAGE MAPPINGS & FORMS ====================
class PageMappingCreate(BaseModel):
    organization_id: str
    page_id: str = Field(..., description="15-digit Meta Facebook Page ID")
    page_name: str
    page_url: str | None = None

class PageMappingResponse(BaseModel):
    id: str
    organization_id: str
    page_id: str
    page_name: str
    page_url: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LeadFormCreate(BaseModel):
    organization_id: str
    page_id: str
    meta_form_id: str
    form_name: str
    locale: str = "en_US"

class LeadFormResponse(BaseModel):
    id: str
    organization_id: str
    page_id: str
    meta_form_id: str | None = None
    form_name: str
    locale: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== LEADS & KANBAN PIPELINE ====================
class LeadCreate(BaseModel):
    organization_id: str | None = None # Resolved from user token if omitted
    lead_form_id: str | None = None
    leadgen_id: str
    contact_name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_city: str | None = None
    custom_fields: dict[str, Any] = Field(default_factory=dict)
    status: str = Field(default="NEW", description="NEW, CONTACTED, NEGOTIATING, WON, LOST")
    notes: str | None = None

class LeadUpdate(BaseModel):
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_city: str | None = None
    status: str | None = Field(default=None, description="NEW, CONTACTED, NEGOTIATING, WON, LOST")
    notes: str | None = None
    custom_fields: dict[str, Any] | None = None

class LeadStatusUpdate(BaseModel):
    status: str = Field(..., description="Target Kanban stage: NEW, CONTACTED, NEGOTIATING, WON, LOST")

class LeadResponse(BaseModel):
    id: str
    organization_id: str
    lead_form_id: str | None = None
    assigned_user_id: str | None = None
    leadgen_id: str
    contact_name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_city: str | None = None
    custom_fields: dict[str, Any]
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[LeadResponse]


# ==================== LEAD ASSIGNMENT & NOTES ====================
class AssignLeadRequest(BaseModel):
    rep_id: str = Field(..., description="Target Sales Rep User ID")

class BulkAssignLeadsRequest(BaseModel):
    lead_ids: list[str] = Field(..., description="List of Lead IDs to assign")
    rep_id: str = Field(..., description="Target Sales Rep User ID")

class AddLeadNoteRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Note content to append")


# ==================== IMPERSONATION & AUDIT LOGS ====================
class ImpersonateRequest(BaseModel):
    target_organization_id: str

class AuditLogResponse(BaseModel):
    id: str
    actor_id: str | None = None
    target_organization_id: str | None = None
    action: str
    details: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== DASHBOARDS ====================
class SystemStatus(BaseModel):
    metaConnection: str = Field(default="healthy", description="healthy or down")
    lastChecked: str

class LeadOverTimeItem(BaseModel):
    date: str
    leads: int

class RecentActivityItem(BaseModel):
    id: str
    clientName: str
    action: str
    timestamp: str
    type: str = Field(default="lead", description="lead, client, or system")

class SuperAdminDashboardSummaryResponse(BaseModel):
    totalLeadsToday: int
    totalLeadsWeek: int
    totalLeadsMonth: int
    activeClientsCount: int
    totalAdSpendMonth: int
    systemStatus: SystemStatus
    leadsOverTime: list[LeadOverTimeItem]
    recentActivity: list[RecentActivityItem]

class StageFunnelItem(BaseModel):
    stage: str
    count: int

class TeamActivityItem(BaseModel):
    repId: str
    repName: str
    repInitials: str | None = None
    leadsHandled: int
    closedWonCount: int
    conversionRate: float

class ClientDashboardSummaryResponse(BaseModel):
    newLeadsToday: int
    unassignedCount: int
    activeRepsCount: int
    pipelineActiveValue: float
    stageFunnel: list[StageFunnelItem]
    teamActivity: list[TeamActivityItem]

class RepDashboardSummaryResponse(BaseModel):
    assignedLeadsCount: int
    followUpsDueCount: int
    conversionRate: float
    followUpsDue: list[LeadResponse]
    recentActivity: list[RecentActivityItem]


