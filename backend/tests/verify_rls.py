import os
import sys
import uuid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@127.0.0.1:5432/agency_crm")

def verify_rls_isolation():
    print("=" * 70)
    print("      PostgreSQL Row-Level Security (RLS) Isolation Test Suite")
    print("=" * 70)

    if DATABASE_URL.startswith("sqlite"):
        print("[SKIP] SQLite database detected. RLS is a PostgreSQL native feature.")
        print("       To test RLS, run a PostgreSQL instance and update DATABASE_URL in .env.")
        return True

    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        print(f"[FAIL] Could not connect to PostgreSQL at {DATABASE_URL}: {e}")
        print("       Please start PostgreSQL to execute live RLS policy verification.")
        return False

    with engine.begin() as conn:
        print("[1/5] Applying schema.sql with RLS policies...")
        schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "schema.sql"))
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_statements = f.read()
        conn.execute(text(sql_statements))
        print("      RLS Policies applied successfully.")

        print("[2/5] Creating Test Tenants (Tenant A and Tenant B)...")
        tenant_a_id = str(uuid.uuid4())
        tenant_b_id = str(uuid.uuid4())

        # Temporary elevate to super_admin to insert test seed data
        conn.execute(text("SET LOCAL app.is_super_admin = 'true'"))

        conn.execute(
            text("INSERT INTO organizations (id, name) VALUES (:id, :name)"),
            {"id": tenant_a_id, "name": "Test Tenant Alpha"}
        )
        conn.execute(
            text("INSERT INTO organizations (id, name) VALUES (:id, :name)"),
            {"id": tenant_b_id, "name": "Test Tenant Beta"}
        )

        lead_a_id = f"lead_alpha_{uuid.uuid4().hex[:6]}"
        lead_b_id = f"lead_beta_{uuid.uuid4().hex[:6]}"

        conn.execute(
            text("""
                INSERT INTO leads (organization_id, leadgen_id, contact_name, contact_email)
                VALUES (:org_id, :leadgen_id, 'Alpha User', 'alpha@tenant-a.com')
            """),
            {"org_id": tenant_a_id, "leadgen_id": lead_a_id}
        )
        conn.execute(
            text("""
                INSERT INTO leads (organization_id, leadgen_id, contact_name, contact_email)
                VALUES (:org_id, :leadgen_id, 'Beta User', 'beta@tenant-b.com')
            """),
            {"org_id": tenant_b_id, "leadgen_id": lead_b_id}
        )

    # Test 1: Query as Tenant A
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("SET LOCAL app.current_tenant_id = :tid"), {"tid": tenant_a_id})
            conn.execute(text("SET LOCAL app.is_super_admin = 'false'"))
            rows = conn.execute(text("SELECT id, contact_name, organization_id FROM leads")).fetchall()
            print(f"[3/5] Query as Tenant Alpha (ID: {tenant_a_id[:8]}...):")
            print(f"      Rows returned: {len(rows)}")
            for r in rows:
                print(f"      - {r.contact_name} (Org ID: {r.organization_id})")

            assert len(rows) == 1, f"Expected 1 row for Tenant A, got {len(rows)}"
            assert str(rows[0].organization_id) == tenant_a_id, "RLS leaked row from another tenant!"
            print("      ✓ Tenant Alpha isolation VERIFIED!")

    # Test 2: Query as Tenant B
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("SET LOCAL app.current_tenant_id = :tid"), {"tid": tenant_b_id})
            conn.execute(text("SET LOCAL app.is_super_admin = 'false'"))
            rows = conn.execute(text("SELECT id, contact_name, organization_id FROM leads")).fetchall()
            print(f"[4/5] Query as Tenant Beta (ID: {tenant_b_id[:8]}...):")
            print(f"      Rows returned: {len(rows)}")
            for r in rows:
                print(f"      - {r.contact_name} (Org ID: {r.organization_id})")

            assert len(rows) == 1, f"Expected 1 row for Tenant B, got {len(rows)}"
            assert str(rows[0].organization_id) == tenant_b_id, "RLS leaked row from another tenant!"
            print("      ✓ Tenant Beta isolation VERIFIED!")

    # Test 3: Query as Super Admin
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("SET LOCAL app.is_super_admin = 'true'"))
            rows = conn.execute(text("SELECT id, contact_name, organization_id FROM leads")).fetchall()
            print(f"[5/5] Query as Super Admin:")
            print(f"      Rows returned: {len(rows)}")
            assert len(rows) >= 2, f"Super admin expected >= 2 rows, got {len(rows)}"
            print("      ✓ Super Admin global visibility VERIFIED!")

    print("\n" + "=" * 70)
    print("SUCCESS: ALL POSTGRESQL ROW-LEVEL SECURITY (RLS) TESTS PASSED!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    verify_rls_isolation()
