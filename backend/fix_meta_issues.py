from app.db.database import SessionLocal, engine
from app.models.models import PageMapping, Organization, User, LeadForm
from app.core.security import get_password_hash
from sqlalchemy import text

conn = engine.connect()

# Fix 1: Enable RLS on all tables (wiped by test runs)
tables = ['users', 'leads', 'page_mappings', 'lead_forms']
for table in tables:
    conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))
    conn.execute(text(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}"))
    conn.execute(text(f"""
        CREATE POLICY {table}_tenant_isolation ON {table}
        FOR ALL
        USING (
            (organization_id = current_setting('app.current_tenant_id', true)::uuid)
            OR
            (current_setting('app.is_super_admin', true) = 'true')
        )
    """))
print("Fix 1: RLS enabled on all tables")

conn.commit()
conn.close()

# Fix 2: Seed database with correct page mapping
db = SessionLocal()

# Create organization
org = Organization(
    name="Demo Agency Client A",
    primary_contact_name="Account Manager",
    primary_contact_phone="+15550192834",
    primary_contact_email="contact@demoagencyclient.com",
    status="ACTIVE"
)
db.add(org)
db.commit()
db.refresh(org)
print(f"Fix 2: Created org: {org.id}")

# Create page mapping with correct page_id
mapping = PageMapping(
    organization_id=org.id,
    page_id="109283746554321",
    page_name="Demo Client Official Facebook Page",
    page_url="https://www.facebook.com/demoagencyclient/"
)
db.add(mapping)
db.commit()
print(f"Fix 2: Created page mapping for page_id: 109283746554321")

# Create lead form
form = LeadForm(
    organization_id=org.id,
    page_id="109283746554321",
    meta_form_id="form_demo_lead_gen_2026",
    form_name="Standard Web Lead Form 2026",
    locale="en_US"
)
db.add(form)
db.commit()
print(f"Fix 2: Created lead form")

# Create super admin user
super_admin = User(
    email="admin@marketbytes.com",
    hashed_password=get_password_hash("MarketBytesAdmin2026!"),
    full_name="Market Bytes Super Admin",
    role="SUPER_ADMIN",
    is_active=True
)
db.add(super_admin)

# Create client admin user
client_admin = User(
    organization_id=org.id,
    email="clientadmin@demoagencyclient.com",
    hashed_password=get_password_hash("ClientAdmin2026!"),
    full_name="Demo Client Admin",
    role="CLIENT_ADMIN",
    is_active=True
)
db.add(client_admin)
db.commit()
print("Fix 2: Created users")

db.close()
print("\nAll fixes applied!")
