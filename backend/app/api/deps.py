import jwt
from typing import Generator, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db, get_tenant_db
from app.models.models import User
from app.core.security import decode_access_token

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    token: str = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
) -> User:
    """
    Decodes bearer JWT token and fetches active User from database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency factory checking if current authenticated user possesses required role(s).
    Example: Depends(require_roles("SUPER_ADMIN", "CLIENT_ADMIN"))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {allowed_roles}, provided: {current_user.role}"
            )
        return current_user
    return role_checker


def get_current_user_optional(
    token: str | None = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)),
    db: Session = Depends(get_db)
) -> User | None:
    """
    Optional user extractor: returns User if bearer token is valid, None otherwise.
    """
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()
    except Exception:
        return None


def get_tenant_db(
    x_tenant_id: str | None = Depends(lambda: None),
    current_user: User | None = Depends(get_current_user_optional)
) -> Generator[Session, None, None]:
    """
    Primary FastAPI Database Dependency for Multi-Tenant RLS Scoping.
    Dynamically resolves active tenant_id and Super Admin status from authenticated user session
    or X-Tenant-ID header, setting PostgreSQL `SET LOCAL app.current_tenant_id` per request.
    """
    from app.db.database import get_tenant_db as raw_get_tenant_db

    is_super_admin = False
    tenant_id = None

    if current_user:
        if current_user.role == "SUPER_ADMIN":
            is_super_admin = True
            # Super Admin can target specific tenant via header or access globally
            tenant_id = x_tenant_id or (str(current_user.organization_id) if current_user.organization_id else None)
        else:
            is_super_admin = False
            tenant_id = str(current_user.organization_id) if current_user.organization_id else None
    elif x_tenant_id:
        tenant_id = str(x_tenant_id)

    # Delegate session creation & SET LOCAL execution to raw_get_tenant_db
    for session in raw_get_tenant_db(tenant_id=tenant_id, is_super_admin=is_super_admin):
        yield session


def get_db_for_current_user(
    current_user: User = Depends(get_current_user)
) -> Generator[Session, None, None]:
    """
    Alias dependency guaranteeing user authentication before injecting a tenant-scoped DB session.
    """
    is_super_admin = (current_user.role == "SUPER_ADMIN")
    tenant_id = str(current_user.organization_id) if current_user.organization_id else None

    from app.db.database import get_tenant_db as raw_get_tenant_db
    for session in raw_get_tenant_db(tenant_id=tenant_id, is_super_admin=is_super_admin):
        yield session

