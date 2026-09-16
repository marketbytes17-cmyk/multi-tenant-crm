import logging
from app.workers.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.models import PageMapping, Lead, LeadForm


logger = logging.getLogger(__name__)

@celery_app.task(name="app.workers.tasks.process_new_lead")
def process_new_lead(page_id: str, leadgen_id: str, form_id: str = None):
    db = SessionLocal()
    try:
        # 1. Resolve tenant organization via page mapping
        mapping = db.query(PageMapping).filter(PageMapping.page_id == page_id).first()
        if not mapping:
            logger.error(f"No active tenant found for Page ID: {page_id}")
            return {"status": "ignored", "reason": "unmapped_page"}

        # 2. Check for deduplication
        existing = db.query(Lead).filter(Lead.leadgen_id == leadgen_id).first()
        if existing:
            return {"status": "duplicate", "lead_id": str(existing.id)}

        # 3. Simulate or fetch Meta Lead payload
        # (In production, replace with Graph API call: GET /{leadgen_id}?access_token=...)
        form_record = None
        if form_id:
            form_record = db.query(LeadForm).filter(LeadForm.meta_form_id == form_id).first()

        # Simulated incoming payload (In production, fetched dynamically via Meta Graph API)
        extracted_data = {
            "full_name": "Jane Smith",
            "email": "jane.smith@example.com",
            "phone_number": "+15550192834",
            "city": "Metro City",
            "custom": {
                "inquiry_type": "General Inquiry",
                "preferred_contact": "Email",
                "form_name": form_record.form_name if form_record else "Standard Web Lead Form 2026"
            }
        }

        # 4. Persist to PostgreSQL
        new_lead = Lead(
            organization_id=mapping.organization_id,
            lead_form_id=form_record.id if form_record else None,
            leadgen_id=leadgen_id,
            contact_name=extracted_data["full_name"],
            contact_email=extracted_data["email"],
            contact_phone=extracted_data["phone_number"],
            contact_city=extracted_data["city"],
            custom_fields=extracted_data["custom"],
            raw_payload=extracted_data,
            status="NEW"
        )
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        logger.info(f"Ingested lead {new_lead.id} for Organization {mapping.organization_id}")
        return {"status": "success", "lead_id": str(new_lead.id)}

    except Exception as exc:
        db.rollback()
        logger.exception(f"Error processing lead: {exc}")
        raise exc
    finally:
        db.close()