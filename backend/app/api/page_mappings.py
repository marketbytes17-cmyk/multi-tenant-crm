from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import PageMapping, LeadForm, User
from app.schemas.crm import PageMappingCreate, PageMappingResponse, LeadFormCreate, LeadFormResponse
from app.api.deps import get_db_for_current_user, get_current_user, require_roles

router = APIRouter(
    prefix="",
    tags=["Meta Page Mappings & Lead Forms"],
    dependencies=[Depends(require_roles("SUPER_ADMIN"))]
)

# Page Mappings
@router.get("/page-mappings", response_model=list[PageMappingResponse])
def list_page_mappings(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Lists Facebook Page Mappings connected to the current tenant organization (RLS scoped).
    """
    return db.query(PageMapping).order_by(PageMapping.created_at.desc()).all()


@router.post("/page-mappings", response_model=PageMappingResponse, status_code=status.HTTP_201_CREATED)
def create_page_mapping(
    mapping_in: PageMappingCreate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Connects a Meta Facebook Page ID (15-digit) to a client tenant organization.
    """
    existing = db.query(PageMapping).filter(PageMapping.page_id == mapping_in.page_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Page ID '{mapping_in.page_id}' is already mapped to an organization."
        )

    mapping = PageMapping(
        organization_id=mapping_in.organization_id,
        page_id=mapping_in.page_id,
        page_name=mapping_in.page_name,
        page_url=mapping_in.page_url
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping


@router.delete("/page-mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page_mapping(
    mapping_id: str,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a Meta Page Mapping.
    """
    mapping = db.query(PageMapping).filter(PageMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page mapping not found."
        )
    db.delete(mapping)
    db.commit()
    return None


# Lead Forms
@router.get("/lead-forms", response_model=list[LeadFormResponse])
def list_lead_forms(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Lists registered Meta Lead Forms connected to the current tenant organization (RLS scoped).
    """
    return db.query(LeadForm).order_by(LeadForm.created_at.desc()).all()


@router.post("/lead-forms", response_model=LeadFormResponse, status_code=status.HTTP_201_CREATED)
def create_lead_form(
    form_in: LeadFormCreate,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(get_current_user)
):
    """
    Registers a Meta Lead Form under a Page Mapping and organization.
    """
    existing = db.query(LeadForm).filter(LeadForm.meta_form_id == form_in.meta_form_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Meta Form ID '{form_in.meta_form_id}' is already registered."
        )

    form = LeadForm(
        organization_id=form_in.organization_id,
        page_id=form_in.page_id,
        meta_form_id=form_in.meta_form_id,
        form_name=form_in.form_name,
        locale=form_in.locale
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form
