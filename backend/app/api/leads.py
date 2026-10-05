from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.models import Lead, User
from app.schemas.crm import (
    LeadCreate, LeadUpdate, LeadStatusUpdate, LeadResponse, LeadListResponse,
    AssignLeadRequest, BulkAssignLeadsRequest, AddLeadNoteRequest
)
from app.api.deps import get_db_for_current_user, get_current_user

router = APIRouter(prefix="/leads", tags=["Leads & Kanban Pipeline"])

@router.get("", response_model=LeadListResponse)
def list_leads(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status", description="Filter by Kanban stage: NEW, CONTACTED, NEGOTIATING, WON, LOST"),
    search: str | None = Query(None, description="Search contact_name, contact_email, contact_phone"),
    unassigned_only: bool = Query(False, alias="unassigned", description="Filter to unassigned leads only"),
    organization_id: str | None = Query(None, description="Filter by organization ID for Super Admin"),
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    List leads for the current tenant organization (RLS enforced).
    Supports pagination, status filtering for Kanban columns, text search, and unassigned filtering.
    """
    query = db.query(Lead)

    if current_user.role == "SUPER_ADMIN" and organization_id:
        query = query.filter(Lead.organization_id == organization_id)

    if status_filter:
        query = query.filter(Lead.status == status_filter.upper())
    
    if unassigned_only:
        query = query.filter(Lead.assigned_user_id.is_(None))
    
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Lead.contact_name.ilike(pattern),
                Lead.contact_email.ilike(pattern),
                Lead.contact_phone.ilike(pattern),
                Lead.contact_city.ilike(pattern)
            )
        )
    
    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": leads
    }


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Manually creates a lead under the current tenant organization.
    """
    org_id = current_user.organization_id if not (current_user.role == "SUPER_ADMIN" and lead_in.organization_id) else lead_in.organization_id
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="organization_id is required to create a lead"
        )
    
    import uuid
    if not lead_in.leadgen_id:
        lead_in.leadgen_id = f"manual_{uuid.uuid4().hex[:12]}"

    existing = db.query(Lead).filter(Lead.leadgen_id == lead_in.leadgen_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lead with leadgen_id '{lead_in.leadgen_id}' already exists."
        )

    lead = Lead(
        organization_id=org_id,
        lead_form_id=lead_in.lead_form_id,
        leadgen_id=lead_in.leadgen_id,
        contact_name=lead_in.contact_name,
        contact_email=lead_in.contact_email,
        contact_phone=lead_in.contact_phone,
        contact_city=lead_in.contact_city,
        custom_fields=lead_in.custom_fields or {},
        status=lead_in.status.upper() if lead_in.status else "NEW",
        notes=lead_in.notes
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/assign", response_model=LeadResponse)
def assign_lead(
    lead_id: str,
    body: AssignLeadRequest,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Assigns a lead to a sales rep user.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found or access denied.")
    
    rep = db.query(User).filter(User.id == body.rep_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Target sales rep user not found.")

    # Verify rep belongs to the same organization as the current user
    if current_user.role != "SUPER_ADMIN" and rep.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Cannot assign to a rep outside your organization.")

    lead.assigned_user_id = rep.id
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/bulk-assign")
def bulk_assign_leads(
    body: BulkAssignLeadsRequest,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk assigns multiple unassigned leads to a sales rep.
    """
    rep = db.query(User).filter(User.id == body.rep_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Target sales rep user not found.")

    count = 0
    for l_id in body.lead_ids:
        lead = db.query(Lead).filter(Lead.id == l_id).first()
        if lead:
            lead.assigned_user_id = rep.id
            count += 1

    db.commit()
    return {"success": True, "count": count}


@router.post("/{lead_id}/notes", response_model=LeadResponse)
def add_lead_note(
    lead_id: str,
    body: AddLeadNoteRequest,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Appends a new note to a lead.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found or access denied.")

    existing_notes = lead.notes or ""
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    note_line = f"[{timestamp}] {current_user.full_name}: {body.content}\n"
    lead.notes = note_line + existing_notes
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a single lead by ID (RLS scoped).
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied."
        )
    return lead


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Updates lead details or moves lead to a new Kanban stage (NEW, CONTACTED, NEGOTIATING, WON, LOST).
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied."
        )
    
    update_data = lead_in.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].upper()

    for field, val in update_data.items():
        setattr(lead, field, val)
    
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_kanban_status(
    lead_id: str,
    status_in: LeadStatusUpdate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Dedicated endpoint for Kanban Board drag-and-drop status transitions.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied."
        )
    
    lead.status = status_in.status.upper()
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a lead (RLS scoped).
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied."
        )
    
    db.delete(lead)
    db.commit()
    return None

