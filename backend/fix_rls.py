from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()

# Enable RLS on users table
conn.execute(text("ALTER TABLE users ENABLE ROW LEVEL SECURITY"))

# Create policy: users can only see users in their own organization
# Super admins can see all users
conn.execute(text("""
    CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (
        (organization_id = current_setting('app.current_tenant_id', true)::uuid)
        OR
        (current_setting('app.is_super_admin', true) = 'true')
    )
"""))

conn.commit()
print("RLS enabled on users table")
conn.close()
