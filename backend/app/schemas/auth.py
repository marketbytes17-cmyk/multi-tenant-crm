from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None
    org_id: str | None = None
    role: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2)
    organization_id: str | None = None
    role: str = Field(default="SALES_REP", description="SUPER_ADMIN, CLIENT_ADMIN, or SALES_REP")

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
