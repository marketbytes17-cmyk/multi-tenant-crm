from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()

# Check RLS status on all tables
tables = ['users', 'leads', 'organizations', 'page_mappings', 'lead_forms', 'audit_logs', 'unmapped_leads']
print("=== RLS Status ===")
for t in tables:
    result = conn.execute(text(f"SELECT relrowsecurity FROM pg_class WHERE relname = '{t}'"))
    rls = result.scalar()
    print(f"  {t}: {'ON' if rls else 'OFF'}")

# Check RLS policies
print("\n=== RLS Policies ===")
result = conn.execute(text("SELECT tablename, policyname, cmd, qual FROM pg_policies ORDER BY tablename"))
policies = result.fetchall()
for p in policies:
    print(f"  {p[0]}: {p[1]} ({p[2]})")
    print(f"    {p[3]}")

# Check for tables without RLS that have organization_id
print("\n=== Tables with organization_id but NO RLS ===")
for t in tables:
    result = conn.execute(text(f"SELECT relrowsecurity FROM pg_class WHERE relname = '{t}'"))
    rls = result.scalar()
    if not rls:
        # Check if table has organization_id column
        result2 = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{t}' AND column_name = 'organization_id'"))
        if result2.fetchone():
            print(f"  {t}: HAS organization_id but RLS is OFF!")

conn.close()
