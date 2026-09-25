from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.models import Lead, User
from app.schemas.crm import LeadCreate, LeadUpdate, LeadStatusUpdate, LeadResponse, LeadListResponse
from app.api.deps import get_db_for_current_user, get_current_user

router = APIRouter(prefix="/leads", tags=["Leads & Kanban Pipeline"])

@router.get("", response_model=LeadListResponse)
def list_leads(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status", description="Filter by Kanban stage: NEW, CONTACTED, NEGOTIATING, WON, LOST"),
    search: str | None = Query(None, description="Search contact_name, contact_email, contact_phone"),
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    List leads for the current tenant organization (RLS enforced).
    Supports pagination, status filtering for Kanban columns, and text search.
    """
    query = db.query(Lead)

    if status_filter:
        query = query.filter(Lead.status == status_filter.upper())
    
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
        custom_fields=lead_in.custom_fields,
        status=lead_in.status.upper(),
        notes=lead_in.notes
    )
    db.add(lead)
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
