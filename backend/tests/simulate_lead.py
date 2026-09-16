import os
import sys
import json
import time
import httpx
from sqlalchemy.orm import Session

# Add backend directory to sys.path so imports work regardless of execution directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, engine, Base
from app.models.models import Organization, PageMapping, LeadForm, Lead


def setup_test_database():
    """Ensure database tables, test organization, and page mapping exist before simulation."""
    print("[Simulator Setup] Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Ensure Tenant Organization
        org = db.query(Organization).filter(
            Organization.name == "Demo Agency Client A"
        ).first()
        if not org:
            org = Organization(
                name="Demo Agency Client A",
                primary_contact_name="Account Manager",
                primary_contact_phone="+15550192834",
                primary_contact_email="contact@demoagencyclient.com"
            )
            db.add(org)
            db.flush()
            print(f"[+] Created Organization: {org.name} (ID: {org.id})")

        # 2. Ensure Meta Page Mapping
        page_id = "109283746554321"
        mapping = db.query(PageMapping).filter(PageMapping.page_id == page_id).first()
        if not mapping:
            mapping = PageMapping(
                page_id=page_id,
                organization_id=org.id,
                page_name="Demo Client Official Facebook Page",
                page_url="https://www.facebook.com/demoagencyclient/"
            )
            db.add(mapping)
            print(f"[+] Created Page Mapping: Page ID {page_id} -> Org {org.name}")

        # 3. Ensure Lead Form
        form_id = "form_demo_lead_gen_2026"
        form = db.query(LeadForm).filter(LeadForm.meta_form_id == form_id).first()
        if not form:
            form = LeadForm(
                organization_id=org.id,
                page_id=page_id,
                meta_form_id=form_id,
                form_name="Standard Web Lead Form 2026",
                locale="en_US"
            )
            db.add(form)
            print(f"[+] Created Lead Form: {form.form_name}")

        db.commit()
        return page_id, form_id, org.id
    except Exception as e:
        db.rollback()
        print(f"[-] Database setup error: {e}")
        raise e
    finally:
        db.close()


def send_simulated_webhook(page_id: str, form_id: str):
    """Sends a realistic Meta Lead Ads POST webhook payload to http://localhost:8000/api/webhooks/meta"""
    leadgen_id = f"sim_lead_{int(time.time())}"
    webhook_url = "http://localhost:8000/api/webhooks/meta"

    payload = {
        "object": "page",
        "entry": [
            {
                "id": page_id,
                "time": int(time.time()),
                "changes": [
                    {
                        "field": "leadgen",
                        "value": {
                            "ad_id": "238510294817201",
                            "form_id": form_id,
                            "leadgen_id": leadgen_id,
                            "created_time": int(time.time()),
                            "page_id": page_id
                        }
                    }
                ]
            }
        ]
    }

    print(f"\n[Simulator] Sending simulated Meta Webhook POST to {webhook_url}...")
    print(f"   Page ID: {page_id}, Form ID: {form_id}, Leadgen ID: {leadgen_id}")

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                webhook_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-skip-signature-check": "true",
                    "x-sync-process": "true"
                }
            )
            print(f"[Simulator Response] HTTP Status: {resp.status_code}")
            print(f"   Body: {resp.json()}")
            return leadgen_id, resp.status_code == 200
    except Exception as e:
        print(f"[-] Failed to send request to FastAPI server: {e}")
        print("    Make sure your FastAPI server is running with: uvicorn app.main:app --reload --port 8000")
        return leadgen_id, False


def verify_saved_lead(leadgen_id: str, retries: int = 5, delay: float = 1.0):
    """Polls database leads table until Celery worker finishes saving the lead."""
    print(f"\n[Database Audit] Querying database for Leadgen ID: {leadgen_id}...")
    db: Session = SessionLocal()
    try:
        for attempt in range(1, retries + 1):
            lead = db.query(Lead).filter(Lead.leadgen_id == leadgen_id).first()
            if lead:
                print("====================================================")
                print("  LEAD SUCCESSFULLY INGESTED & VERIFIED IN DATABASE!")
                print(f"   Lead ID          : {lead.id}")
                print(f"   Organization ID  : {lead.organization_id}")
                print(f"   Leadgen ID       : {lead.leadgen_id}")
                print(f"   Contact Name     : {lead.contact_name}")
                print(f"   Contact Email    : {lead.contact_email}")
                print(f"   Contact Phone    : {lead.contact_phone}")
                print(f"   Contact City     : {lead.contact_city}")
                print(f"   Custom Fields    : {json.dumps(lead.custom_fields, indent=2)}")
                print(f"   Status           : {lead.status}")
                print(f"   Created At       : {lead.created_at}")
                print("====================================================")
                return True
            time.sleep(delay)

        print(f"[-] Leadgen ID {leadgen_id} not found in database after {retries} retries.")
        print("    Ensure your Celery worker is running: celery -A app.workers.tasks.celery_app worker --loglevel=info -P solo")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("====================================================")
    print("  MULTI-TENANT CRM LEAD SIMULATOR & TEST PIPELINE  ")
    print("====================================================")

    page_id, form_id, org_id = setup_test_database()
    leadgen_id, success = send_simulated_webhook(page_id, form_id)

    if success:
        verify_saved_lead(leadgen_id)
