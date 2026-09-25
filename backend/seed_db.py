import os
import uuid
import bcrypt
from dotenv import load_dotenv

load_dotenv()

from app.db.database import Base, engine, SessionLocal
from app.models.models import Organization, PageMapping, LeadForm, Lead, User

def seed_data():
    print("=" * 70)
    print("      Agency Multi-Tenant CRM Database Seeder")
    print("=" * 70)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Tenant Organization
        print("[1/4] Seeding Demo Client Organization...")
        org_name = "Demo Agency Client A"
        existing_org = db.query(Organization).filter(Organization.name == org_name).first()

        if existing_org:
            org = existing_org
            print(f"      Using existing Organization ID: {org.id}")
        else:
            org = Organization(
                name=org_name,
                primary_contact_name="Account Manager",
                primary_contact_phone="+15550192834",
                primary_contact_email="contact@demoagencyclient.com",
                status="ACTIVE"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"      Created Organization ID: {org.id}")

        # 2. Seed Page Mapping & Lead Form
        print("[2/4] Seeding Facebook Page Mapping & Lead Form...")
        page_id = "109283746554321"
        mapping = db.query(PageMapping).filter(PageMapping.page_id == page_id).first()

        if not mapping:
            mapping = PageMapping(
                organization_id=org.id,
                page_id=page_id,
                page_name="Demo Client Official Facebook Page",
                page_url="https://www.facebook.com/demoagencyclient/"
            )
            db.add(mapping)
            db.commit()
            db.refresh(mapping)
            print(f"      Mapped Facebook Page ID: {page_id}")

        form_meta_id = "form_demo_lead_gen_2026"
        form = db.query(LeadForm).filter(LeadForm.meta_form_id == form_meta_id).first()

        if not form:
            form = LeadForm(
                organization_id=org.id,
                page_id=page_id,
                meta_form_id=form_meta_id,
                form_name="Standard Web Lead Form 2026",
                locale="en_US"
            )
            db.add(form)
            db.commit()
            db.refresh(form)
            print(f"      Registered Lead Form ID: {form.id}")

        # 3. Seed Sample Leads
        print("[3/4] Ingesting Sample Leads...")
        sample_leads = [
            {
                "leadgen_id": f"lead_demo_001",
                "contact_name": "Alex Morgan",
                "contact_email": "alex.morgan@example.com",
                "contact_phone": "+15550192834",
                "contact_city": "New York",
                "custom_fields": {"service_interest": "Digital Marketing Audit", "budget": "$25,000"},
                "status": "NEW",
                "notes": "Requested follow-up call during business hours"
            },
            {
                "leadgen_id": f"lead_demo_002",
                "contact_name": "Sarah Jenkins",
                "contact_email": "sarah.j@example.com",
                "contact_phone": "+15559876543",
                "contact_city": "San Francisco",
                "custom_fields": {"service_interest": "Enterprise CRM Setup", "budget": "$50,000"},
                "status": "CONTACTED",
                "notes": "Interested in multi-channel Meta integration"
            }
        ]

        for item in sample_leads:
            existing_lead = db.query(Lead).filter(Lead.leadgen_id == item["leadgen_id"]).first()
            if not existing_lead:
                lead = Lead(
                    organization_id=org.id,
                    lead_form_id=form.id,
                    leadgen_id=item["leadgen_id"],
                    contact_name=item["contact_name"],
                    contact_email=item["contact_email"],
                    contact_phone=item["contact_phone"],
                    contact_city=item["contact_city"],
                    custom_fields=item["custom_fields"],
                    status=item["status"],
                    notes=item["notes"]
                )
                db.add(lead)
        db.commit()

        # 4. Seed Initial Super Admin & Client Admin Users
        print("[4/4] Seeding Initial Super Admin & Client Admin Users...")
        super_admin_pwd = bcrypt.hashpw("MarketBytesAdmin2026!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        client_admin_pwd = bcrypt.hashpw("ClientAdmin2026!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        if not db.query(User).filter(User.email == "admin@marketbytes.com").first():
            super_admin = User(
                email="admin@marketbytes.com",
                hashed_password=super_admin_pwd,
                full_name="Market Bytes Super Admin",
                role="SUPER_ADMIN",
                is_active=True
            )
            db.add(super_admin)

        if not db.query(User).filter(User.email == "clientadmin@demoagencyclient.com").first():
            client_admin = User(
                organization_id=org.id,
                email="clientadmin@demoagencyclient.com",
                hashed_password=client_admin_pwd,
                full_name="Demo Client Admin",
                role="CLIENT_ADMIN",
                is_active=True
            )
            db.add(client_admin)

        db.commit()

        print("\n" + "=" * 70)
        print("SEEDING COMPLETE! Multi-Tenant sample data & initial users ready.")
        print("Super Admin Credentials:  admin@marketbytes.com / MarketBytesAdmin2026!")
        print("Client Admin Credentials: clientadmin@demoagencyclient.com / ClientAdmin2026!")
        print("=" * 70)

    except Exception as err:
        db.rollback()
        print(f"[Error] Seeding failed: {err}")
        raise err
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
