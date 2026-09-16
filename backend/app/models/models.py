import uuid
import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

# Universal Type Definitions (PostgreSQL native UUID & JSONB, SQLite variants)
UUID_TYPE = UUID(as_uuid=True).with_variant(String(36), 'sqlite')
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

    __table_args__ = (
        Index('idx_leads_org_id', 'organization_id'),
        Index('idx_leads_created_at', created_at.desc()),
    )

