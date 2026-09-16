# Project Specification: Multi-Tenant Agency CRM

## 1. Project Overview
This project is a multi-tenant CRM built for a digital marketing agency to ingest real-time lead data from Meta (Facebook) Lead Ads across multiple client accounts. 

**Critical Architectural Constraint:** 
Do NOT implement a client-facing Meta OAuth 2.0 login flow. The system is designed for **Zero Client Friction**. It uses a single Meta Webhook and a single Master System User Access Token tied to the agency's Meta Business Manager. Client data isolation is handled entirely on the backend via a PostgreSQL database mapping table.

## 2. Tech Stack Definition
This project uses a decoupled frontend and backend architecture:
*   **Frontend (UI):** Next.js (App Router), React, Tailwind CSS, shadcn/ui.
*   **Backend (API & Webhooks):** FastAPI (Python) running on an ASGI server (Uvicorn).
*   **Database:** PostgreSQL (using SQLAlchemy or SQLModel ORM).
*   **Background Processing:** Redis + Celery (or ARQ) for asynchronous Python workers.
*   **Authentication:** NextAuth.js (or similar) on the frontend, issuing JWTs verified by FastAPI.

## 3. Database Schema (PostgreSQL + SQLAlchemy)
The backend must define the following relational schema. Ensure `custom_fields` utilizes PostgreSQL's `JSONB` to store dynamic form answers.

```python
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base
import uuid
import datetime

Base = declarative_base()

class Client(Base):
    __tablename__ = "clients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class PageMapping(Base):
    __tablename__ = "page_mappings"
    page_id = Column(String(50), primary_key=True) # 15-digit FB Page ID
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    page_name = Column(String(255))

class Lead(Base):
    __tablename__ = "leads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    source = Column(String(50), default="facebook")
    page_id = Column(String(50), ForeignKey("page_mappings.page_id"))
    leadgen_id = Column(String(100), unique=True, nullable=False)
    contact_name = Column(String(255))
    contact_phone = Column(String(50))
    contact_email = Column(String(255))
    custom_fields = Column(JSONB) # Stores dynamic answers e.g., {"budget": "50L"}
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    __table_args__ = (
        Index('idx_leads_client_created', 'client_id', 'created_at'),
    )