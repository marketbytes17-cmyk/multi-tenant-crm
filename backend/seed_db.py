import os
import uuid
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@127.0.0.1:5432/agency_crm")
engine = create_engine(DATABASE_URL)

def seed_data():
    with engine.begin() as conn:
        print("[1/3] Seeding Generic Tenant Organization...")
        org_name = "Demo Agency Client A"
        existing_org = conn.execute(
            text("SELECT id FROM organizations WHERE name = :name"),
            {"name": org_name}
        ).fetchone()

        if existing_org:
            org_id = str(existing_org.id)
            print(f"   Using existing Organization ID: {org_id}")
        else:
            org_id = str(uuid.uuid4())
            conn.execute(
                text("""
                    INSERT INTO organizations (id, name, primary_contact_name, primary_contact_phone, primary_contact_email)
                    VALUES (:id, :name, :contact_name, :phone, :email)
                """),
                {
                    "id": org_id,
                    "name": org_name,
                    "contact_name": "Account Manager",
                    "phone": "+15550192834",
                    "email": "contact@demoagencyclient.com"
                }
            )
            print(f"   Created new Organization ID: {org_id}")

        print("[2/3] Seeding Meta Page Mapping & Lead Form...")
        page_id = "109283746554321"
        conn.execute(
            text("""
                INSERT INTO page_mappings (organization_id, page_id, page_name, page_url)
                VALUES (:org_id, :page_id, :page_name, :page_url)
                ON CONFLICT (page_id) DO UPDATE SET page_name = EXCLUDED.page_name
            """),
            {
                "org_id": org_id,
                "page_id": page_id,
                "page_name": "Demo Client Official Facebook Page",
                "page_url": "https://www.facebook.com/demoagencyclient/"
            }
        )

        form_id_gen = str(uuid.uuid4())
        res = conn.execute(
            text("""
                INSERT INTO lead_forms (id, organization_id, page_id, meta_form_id, form_name, locale)
                VALUES (:id, :org_id, :page_id, :meta_form_id, :name, 'en_US')
                ON CONFLICT (meta_form_id) DO UPDATE SET form_name = EXCLUDED.form_name
                RETURNING id
            """),
            {
                "id": form_id_gen,
                "org_id": org_id,
                "page_id": page_id,
                "meta_form_id": "form_demo_lead_gen_2026",
                "name": "Standard Web Lead Form 2026"
            }
        )
        form_id = str(res.scalar())
        print(f"   Lead Form ID: {form_id}")

        print("[3/3] Ingesting Sample Leads into Database...")
        sample_leads = [
            {
                "leadgen_id": f"lead_demo_{uuid.uuid4().hex[:8]}",
                "contact_name": "Alex Morgan",
                "contact_email": "alex.morgan@example.com",
                "contact_phone": "+15550192834",
                "contact_city": "New York",
                "service_interest": "Digital Marketing Audit",
                "notes": "Requested follow-up call during business hours"
            },
            {
                "leadgen_id": f"lead_demo_{uuid.uuid4().hex[:8]}",
                "contact_name": "Sarah Jenkins",
                "contact_email": "sarah.j@example.com",
                "contact_phone": "+15559876543",
                "contact_city": "San Francisco",
                "service_interest": "Enterprise CRM Setup",
                "notes": "Interested in multi-channel Meta integration"
            }
        ]

        for lead in sample_leads:
            custom_payload = json.dumps({
                "service_interest": lead["service_interest"],
                "consultation_type": "Initial Discovery Call",
                "form_name": "Standard Web Lead Form 2026"
            })
            conn.execute(
                text("""
                    INSERT INTO leads (
                        organization_id, lead_form_id, leadgen_id,
                        contact_name, contact_email, contact_phone, contact_city,
                        custom_fields, status, notes
                    ) VALUES (
                        :org_id, :form_id, :leadgen_id,
                        :name, :email, :phone, :city,
                        CAST(:custom_fields AS jsonb), 'NEW', :notes
                    )
                """),
                {
                    "org_id": org_id,
                    "form_id": form_id,
                    "leadgen_id": lead["leadgen_id"],
                    "name": lead["contact_name"],
                    "email": lead["contact_email"],
                    "phone": lead["contact_phone"],
                    "city": lead["contact_city"],
                    "custom_fields": custom_payload,
                    "notes": lead["notes"]
                }
            )

    print("\nSEEDING COMPLETE! Generic Multi-Tenant sample data is ready in PostgreSQL.")

if __name__ == "__main__":
    seed_data()
