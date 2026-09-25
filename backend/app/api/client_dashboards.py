from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Lead, User, Organization
from app.schemas.crm import ClientDashboardSummaryResponse, RepDashboardSummaryResponse, StageFunnelItem, TeamActivityItem
from app.schemas.auth import UserCreate, UserResponse
from app.core.security import get_password_hash
from app.api.deps import get_db_for_current_user, get_current_user

client_router = APIRouter(prefix="/client", tags=["Client Admin Portal"])
rep_router = APIRouter(prefix="/rep", tags=["Sales Rep Portal"])
team_router = APIRouter(prefix="/team", tags=["Team & Sales Rep Management"])


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


@team_router.get("", response_model=list[UserResponse])
def list_team_members(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Lists sales reps and admins for the current tenant organization (RLS scoped).
    """
    return db.query(User).order_by(User.created_at.desc()).all()


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
    db.commit()
    db.refresh(new_user)
    return new_user
