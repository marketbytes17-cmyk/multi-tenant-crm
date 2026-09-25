from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Organization, AuditLog, User
from app.schemas.auth import Token
from app.schemas.crm import AuditLogResponse
from app.core.security import create_access_token
from app.api.deps import get_db_for_current_user, require_roles

router = APIRouter(prefix="/admin", tags=["Super Admin & Impersonation"])

@router.post("/impersonate/{target_tenant_id}", response_model=Token)
def impersonate_tenant(
    target_tenant_id: str,
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(require_roles("SUPER_ADMIN"))
):
    """
    Super Admin Impersonation Endpoint.
    Generates a scoped JWT access token authorizing the Super Admin to view the target client's portal.
    CRITICAL SECURITY MANDATE: Action MUST be audit-logged into audit_logs table with actor ID and timestamp.
    """
    target_org = db.query(Organization).filter(Organization.id == target_tenant_id).first()
    if not target_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target tenant organization not found."
        )

    # 1. Audit Log Entry
    audit_entry = AuditLog(
        actor_id=current_user.id,
        target_organization_id=target_tenant_id,
        action="IMPERSONATE_TENANT",
        details={
            "actor_email": current_user.email,
            "target_org_name": target_org.name,
            "purpose": "Super Admin Support / Portal Inspection"
        }
    )
    db.add(audit_entry)
    db.commit()

    # 2. Issue scoped JWT token (with target tenant organization_id)
    impersonated_token = create_access_token(
        subject=str(current_user.id),
        organization_id=target_tenant_id,
        role="CLIENT_ADMIN" # Elevates context for tenant portal rendering while preserving actor audit identity
    )

    return {
        "access_token": impersonated_token,
        "token_type": "bearer"
    }


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db_for_current_user),
    current_user: User = Depends(require_roles("SUPER_ADMIN"))
):
    """
    Retrieves global audit logs for agency security monitoring (Super Admin only).
    """
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
