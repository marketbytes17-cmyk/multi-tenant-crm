import uuid
import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type natively, and CHAR(36) for SQLite.
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return str(value)
        else:
            return str(value) if isinstance(value, uuid.UUID) else str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return str(value)

UUID_TYPE = GUID()
JSON_TYPE = JSONB().with_variant(JSON(), 'sqlite')



class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    primary_contact_name = Column(String(150))
    primary_contact_phone = Column(String(50))
    primary_contact_email = Column(String(150))
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    page_mappings = relationship("PageMapping", back_populates="organization", cascade="all, delete-orphan")
    lead_forms = relationship("LeadForm", back_populates="organization", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID_TYPE, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True) # NULL for SUPER_ADMIN
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False, default="SALES_REP") # SUPER_ADMIN, CLIENT_ADMIN, SALES_REP
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

    __table_args__ = (
        Index('idx_users_org_id', 'organization_id'),
        Index('idx_users_email', 'email'),
    )



class PageMapping(Base):
    __tablename__ = "page_mappings"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID_TYPE, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(String(100), unique=True, nullable=False)  # 15-digit FB Page ID
    page_name = Column(String(255), nullable=False)
    page_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="page_mappings")
    lead_forms = relationship("LeadForm", back_populates="page_mapping", cascade="all, delete-orphan")


class LeadForm(Base):
    __tablename__ = "lead_forms"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID_TYPE, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(String(100), ForeignKey("page_mappings.page_id", ondelete="CASCADE"), nullable=False)
    meta_form_id = Column(String(100), unique=True)
    form_name = Column(String(255), nullable=False)
    locale = Column(String(20), default="ml_IN")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="lead_forms")
    page_mapping = relationship("PageMapping", back_populates="lead_forms")
    leads = relationship("Lead", back_populates="lead_form", cascade="all, delete-orphan")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID_TYPE, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    lead_form_id = Column(UUID_TYPE, ForeignKey("lead_forms.id", ondelete="SET NULL"), nullable=True)
    assigned_user_id = Column(UUID_TYPE, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    leadgen_id = Column(String(100), unique=True, nullable=False)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    contact_city = Column(String(100))
    custom_fields = Column(JSON_TYPE, nullable=False, default=dict)
    status = Column(String(50), default="NEW")
    notes = Column(Text)
    raw_payload = Column(JSON_TYPE)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="leads")
    lead_form = relationship("LeadForm", back_populates="leads")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])

    __table_args__ = (
        Index('idx_leads_org_id', 'organization_id'),
        Index('idx_leads_assigned_user', 'assigned_user_id'),
        Index('idx_leads_created_at', created_at.desc()),
    )



class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID_TYPE, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_organization_id = Column(UUID_TYPE, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON_TYPE, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    actor = relationship("User")
    target_organization = relationship("Organization")

    __table_args__ = (
        Index('idx_audit_logs_actor', 'actor_id'),
        Index('idx_audit_logs_target', 'target_organization_id'),
    )


class UnmappedLead(Base):
    __tablename__ = "unmapped_leads"

    id = Column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    page_id = Column(String(100), nullable=False)
    form_id = Column(String(100), nullable=True)
    leadgen_id = Column(String(100), nullable=False)
    error_reason = Column(String(255), default="UNMAPPED_PAGE")
    raw_payload = Column(JSON_TYPE)
    status = Column(String(50), default="UNMAPPED") # UNMAPPED, REPROCESSED, RESOLVED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (
        Index('idx_unmapped_leads_page', 'page_id'),
        Index('idx_unmapped_leads_status', 'status'),
    )



