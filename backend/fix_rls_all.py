from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()

# Tables that need RLS (all have organization_id)
tables = ['users', 'leads', 'page_mappings', 'lead_forms']

for table in tables:
    # Enable RLS
    conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))

    # Drop existing policy if exists
    conn.execute(text(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}"))

    # Create policy: users can only see rows in their own organization
    # Super admins can see all rows
    conn.execute(text(f"""
        CREATE POLICY {table}_tenant_isolation ON {table}
        FOR ALL
        USING (
            (organization_id = current_setting('app.current_tenant_id', true)::uuid)
            OR
            (current_setting('app.is_super_admin', true) = 'true')
        )
    """))

    print(f"RLS enabled on {table}")

conn.commit()
conn.close()
print("\nAll tables secured.")
