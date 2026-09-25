from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Organization, User
from app.schemas.crm import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.api.deps import get_db_for_current_user, get_current_user, require_roles

router = APIRouter(prefix="/organizations", tags=["Client Organizations / Tenants"])

@router.get("", response_model=list[OrganizationResponse])
def list_organizations(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Lists client organizations (RLS scoped: SUPER_ADMIN sees all, tenant users see their own organization).
    """
    return db.query(Organization).order_by(Organization.created_at.desc()).all()


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(require_roles("SUPER_ADMIN"))
):
    """
    Provisions a new client tenant organization (Super Admin only).
    """
    org = Organization(
        name=org_in.name,
        primary_contact_name=org_in.primary_contact_name,
        primary_contact_phone=org_in.primary_contact_phone,
        primary_contact_email=org_in.primary_contact_email,
        status=org_in.status
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: str,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves client tenant details by ID (RLS scoped).
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or access denied."
        )
    return org


@router.patch("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: str,
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Updates client tenant organization details (Super Admin or Client Admin of that tenant).
    """
    if current_user.role != "SUPER_ADMIN" and str(current_user.organization_id) != str(org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this organization."
        )

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or access denied."
        )

    update_data = org_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(org, field, val)

    db.commit()
    db.refresh(org)
    return org
