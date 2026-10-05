from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Lead, User, Organization, AuditLog
from app.schemas.crm import (
    ClientDashboardSummaryResponse, RepDashboardSummaryResponse, StageFunnelItem, TeamActivityItem,
    ClientReportDataResponse, PerformanceOverTimeItem, RepPerformanceItem,
    RepPerformanceDataResponse, RepPerformanceTrendItem,
    OrgSettingsResponse, OrgSettingsUpdate, RepSettingsResponse, RepSettingsUpdate
)
from app.schemas.auth import UserCreate, UserResponse
from app.core.security import get_password_hash
from app.api.deps import get_db_for_current_user, get_current_user, require_roles

client_router = APIRouter(prefix="/client", tags=["Client Admin Portal"])
rep_router = APIRouter(prefix="/rep", tags=["Sales Rep Portal"])
team_router = APIRouter(
    prefix="/team",
    tags=["Team & Sales Rep Management"],
    dependencies=[Depends(require_roles("SUPER_ADMIN", "CLIENT_ADMIN"))]
)




@client_router.get("/dashboard-summary", response_model=ClientDashboardSummaryResponse)
def get_client_dashboard_summary(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Client Admin Dashboard Summary Endpoint.
    Returns:
      - newLeadsToday count
      - unassignedCount
      - activeRepsCount
      - pipelineActiveValue estimate
      - stageFunnel: breakdown per Kanban stage
      - teamActivity: performance stats per rep
    """
    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Stat Card Metrics
    new_leads_today = db.query(Lead).filter(Lead.created_at >= start_of_today).count()
    unassigned_count = db.query(Lead).filter(Lead.assigned_user_id.is_(None)).count()
    
    reps = db.query(User).filter(User.role == "SALES_REP", User.is_active.is_(True)).all()
    active_reps_count = len(reps)

    # 2. Stage Funnel Counts
    stages = ["NEW", "CONTACTED", "NEGOTIATING", "WON", "LOST"]
    stage_funnel = []
    for st in stages:
        cnt = db.query(Lead).filter(Lead.status == st).count()
        stage_funnel.append(StageFunnelItem(stage=st.title(), count=cnt))

    # 3. Team Activity
    team_activity = []
    for r in reps:
        handled = db.query(Lead).filter(Lead.assigned_user_id == r.id).count()
        won = db.query(Lead).filter(Lead.assigned_user_id == r.id, Lead.status == "WON").count()
        conv_rate = round((won / handled * 100), 1) if handled > 0 else 0.0

        initials = "".join([part[0] for part in r.full_name.split()]).upper()[:2] if r.full_name else "SR"
        team_activity.append(TeamActivityItem(
            repId=str(r.id),
            repName=r.full_name,
            repInitials=initials,
            leadsHandled=handled,
            closedWonCount=won,
            conversionRate=conv_rate
        ))

    return ClientDashboardSummaryResponse(
        newLeadsToday=new_leads_today,
        unassignedCount=unassigned_count,
        activeRepsCount=active_reps_count,
        pipelineActiveValue=42500.0,
        stageFunnel=stage_funnel,
        teamActivity=team_activity
    )


@client_router.get("/reports", response_model=ClientReportDataResponse)
def get_client_reports(
    from_date: str | None = None,
    to_date: str | None = None,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Client Admin Reports Endpoint.
    Returns tenant performance over time (last 7 days) and per-rep performance breakdown.
    """
    now = datetime.utcnow()

    perf_over_time = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())

        received = db.query(Lead).filter(Lead.created_at >= day_start, Lead.created_at <= day_end).count()
        won = db.query(Lead).filter(Lead.created_at >= day_start, Lead.created_at <= day_end, Lead.status == "WON").count()

        perf_over_time.append(PerformanceOverTimeItem(
            date=day_date.strftime("%b %d"),
            leadsReceived=received,
            closedWon=won
        ))

    reps = db.query(User).filter(User.role == "SALES_REP", User.is_active.is_(True)).all()
    rep_perf = []
    for r in reps:
        handled = db.query(Lead).filter(Lead.assigned_user_id == r.id).count()
        won = db.query(Lead).filter(Lead.assigned_user_id == r.id, Lead.status == "WON").count()
        lost = db.query(Lead).filter(Lead.assigned_user_id == r.id, Lead.status == "LOST").count()
        conv_rate = round((won / handled * 100), 1) if handled > 0 else 0.0

        rep_perf.append(RepPerformanceItem(
            repId=str(r.id),
            repName=r.full_name,
            leadsHandled=handled,
            closedWon=won,
            closedLost=lost,
            conversionRate=conv_rate
        ))

    return ClientReportDataResponse(
        performanceOverTime=perf_over_time,
        repPerformance=rep_perf
    )


@rep_router.get("/dashboard-summary", response_model=RepDashboardSummaryResponse)
def get_rep_dashboard_summary(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Sales Rep Personal Dashboard Summary Endpoint.
    """
    my_leads = db.query(Lead).filter(Lead.assigned_user_id == current_user.id).all()
    assigned_count = len(my_leads)

    follow_ups = [l for l in my_leads if l.status in ["CONTACTED", "NEGOTIATING"]]
    won_count = sum(1 for l in my_leads if l.status == "WON")
    conv_rate = round((won_count / assigned_count * 100), 1) if assigned_count > 0 else 0.0

    recent_acts = []
    for l in my_leads[:5]:
        org_name = l.organization.name if l.organization else "Client"
        recent_acts.append({
            "id": f"act_rep_{l.id}",
            "clientName": org_name,
            "action": f"Lead {l.contact_name} status: {l.status}",
            "timestamp": l.updated_at.isoformat() if l.updated_at else datetime.utcnow().isoformat(),
            "type": "lead"
        })

    return RepDashboardSummaryResponse(
        assignedLeadsCount=assigned_count,
        followUpsDueCount=len(follow_ups),
        conversionRate=conv_rate,
        followUpsDue=follow_ups,
        recentActivity=recent_acts
    )


@rep_router.get("/performance", response_model=RepPerformanceDataResponse)
def get_rep_performance(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Sales Rep Personal Performance Endpoint.
    """
    now = datetime.utcnow()
    my_leads = db.query(Lead).filter(Lead.assigned_user_id == current_user.id).all()
    handled = len(my_leads)
    won = sum(1 for l in my_leads if l.status == "WON")
    lost = sum(1 for l in my_leads if l.status == "LOST")
    conv_rate = round((won / handled * 100), 1) if handled > 0 else 0.0

    trend = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())

        received = db.query(Lead).filter(Lead.assigned_user_id == current_user.id, Lead.created_at >= day_start, Lead.created_at <= day_end).count()
        won_day = db.query(Lead).filter(Lead.assigned_user_id == current_user.id, Lead.created_at >= day_start, Lead.created_at <= day_end, Lead.status == "WON").count()

        trend.append(RepPerformanceTrendItem(
            date=day_date.strftime("%b %d"),
            leadsReceived=received,
            closedWon=won_day
        ))

    return RepPerformanceDataResponse(
        leadsHandled=handled,
        closedWonCount=won,
        closedLostCount=lost,
        conversionRate=conv_rate,
        avgResponseTimeHours=1.4,
        performanceTrend=trend
    )


@team_router.get("", response_model=list[UserResponse])
def list_team_members(
    organization_id: str | None = None,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Lists sales reps and admins for the current tenant organization (RLS scoped).
    """
    query = db.query(User)
    if current_user.role == "SUPER_ADMIN" and organization_id:
        query = query.filter(User.organization_id == organization_id)
    elif current_user.role != "SUPER_ADMIN":
        # Non-super-admin users only see members of their own organization
        query = query.filter(User.organization_id == current_user.organization_id)
    return query.order_by(User.created_at.desc()).all()


@team_router.post("/invite", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def invite_team_member(
    user_in: UserCreate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Client Admin inviting/creating a new sales rep inside their organization.
    Security Rule: Organization ID is strictly derived from inviting user's JWT.
    """
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Inviting user must belong to an organization.")

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role="SALES_REP",
        organization_id=current_user.organization_id,
        is_active=True
    )
    db.add(new_user)

    audit_entry = AuditLog(
        actor_id=current_user.id,
        target_organization_id=current_user.organization_id,
        action="INVITE_TEAM_MEMBER",
        details={"invited_user_id": str(new_user.id), "invited_email": new_user.email, "role": "SALES_REP"}
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(new_user)
    return new_user


@team_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    user_id: str,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a team member from the current tenant organization.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Cannot remove user from another organization.")
    db.delete(user)
    db.commit()
    return None


# Settings stores fallback
ORG_SETTINGS_STORE = {}
REP_SETTINGS_STORE = {}

@client_router.get("/settings", response_model=OrgSettingsResponse)
def get_client_org_settings(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Client Organization Settings GET Endpoint.
    """
    org = current_user.organization
    org_name = org.name if org else "Apex Design Co."

    stored = ORG_SETTINGS_STORE.get(str(current_user.organization_id), {})
    return OrgSettingsResponse(
        orgName=stored.get("orgName", org_name),
        logoUrl=stored.get("logoUrl"),
        notifyOnNewLead=stored.get("notifyOnNewLead", True),
        dailySummaryDigest=stored.get("dailySummaryDigest", True),
        leadAssignmentMode=stored.get("leadAssignmentMode", "manual")
    )


@client_router.patch("/settings", response_model=OrgSettingsResponse)
def update_client_org_settings(
    body: OrgSettingsUpdate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Client Organization Settings PATCH Endpoint.
    """
    org_key = str(current_user.organization_id)
    stored = ORG_SETTINGS_STORE.get(org_key, {
        "orgName": current_user.organization.name if current_user.organization else "Apex Design Co.",
        "notifyOnNewLead": True,
        "dailySummaryDigest": True,
        "leadAssignmentMode": "manual"
    })

    update_data = body.model_dump(exclude_unset=True)
    stored.update(update_data)
    ORG_SETTINGS_STORE[org_key] = stored

    if "orgName" in update_data and current_user.organization:
        current_user.organization.name = update_data["orgName"]
        db.commit()

    return OrgSettingsResponse(**stored)


@rep_router.get("/settings", response_model=RepSettingsResponse)
def get_rep_settings(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Sales Rep Personal Settings GET Endpoint.
    """
    user_key = str(current_user.id)
    stored = REP_SETTINGS_STORE.get(user_key, {
        "name": current_user.full_name,
        "email": current_user.email,
        "notifyOnNewLead": True,
        "notifyOnFollowUp": True,
        "dailyDigest": False
    })
    return RepSettingsResponse(**stored)


@rep_router.patch("/settings", response_model=RepSettingsResponse)
def update_rep_settings(
    body: RepSettingsUpdate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Sales Rep Personal Settings PATCH Endpoint.
    """
    user_key = str(current_user.id)
    stored = REP_SETTINGS_STORE.get(user_key, {
        "name": current_user.full_name,
        "email": current_user.email,
        "notifyOnNewLead": True,
        "notifyOnFollowUp": True,
        "dailyDigest": False
    })

    update_data = body.model_dump(exclude_unset=True)
    stored.update(update_data)
    REP_SETTINGS_STORE[user_key] = stored

    if "name" in update_data:
        current_user.full_name = update_data["name"]
        db.commit()

    return RepSettingsResponse(**stored)


