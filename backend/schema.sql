CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_contact_name VARCHAR(150),
    primary_contact_phone VARCHAR(50),
    primary_contact_email VARCHAR(150),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    page_id VARCHAR(100) UNIQUE NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    page_id VARCHAR(100) NOT NULL REFERENCES page_mappings(page_id) ON DELETE CASCADE,
    meta_form_id VARCHAR(100) UNIQUE,
    form_name VARCHAR(255) NOT NULL,
    locale VARCHAR(20) DEFAULT 'ml_IN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_form_id UUID REFERENCES lead_forms(id) ON DELETE SET NULL,
    leadgen_id VARCHAR(100) UNIQUE NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_city VARCHAR(100),
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'NEW',
    notes TEXT,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields ON leads USING gin (custom_fields);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULLABLE for SUPER_ADMIN
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SALES_REP' CHECK (role IN ('SUPER_ADMIN', 'CLIENT_ADMIN', 'SALES_REP')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_organization_id);

CREATE TABLE IF NOT EXISTS unmapped_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id VARCHAR(100) NOT NULL,
    form_id VARCHAR(100),
    leadgen_id VARCHAR(100) NOT NULL,
    error_reason VARCHAR(255) DEFAULT 'UNMAPPED_PAGE',
    raw_payload JSONB,
    status VARCHAR(50) DEFAULT 'UNMAPPED', -- UNMAPPED, REPROCESSED, RESOLVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unmapped_leads_page ON unmapped_leads(page_id);
CREATE INDEX IF NOT EXISTS idx_unmapped_leads_status ON unmapped_leads(status);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANT ISOLATION
-- ============================================================================

-- 1. Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmapped_leads ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS for table owners to prevent connection pooling leaks
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE page_mappings FORCE ROW LEVEL SECURITY;
ALTER TABLE lead_forms FORCE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE unmapped_leads FORCE ROW LEVEL SECURITY;

-- 3. Drop existing policies if re-applying
DROP POLICY IF EXISTS org_tenant_isolation ON organizations;
DROP POLICY IF EXISTS page_mappings_tenant_isolation ON page_mappings;
DROP POLICY IF EXISTS lead_forms_tenant_isolation ON lead_forms;
DROP POLICY IF EXISTS leads_tenant_isolation ON leads;
DROP POLICY IF EXISTS users_tenant_isolation ON users;
DROP POLICY IF EXISTS audit_logs_super_admin_only ON audit_logs;
DROP POLICY IF EXISTS unmapped_leads_super_admin_only ON unmapped_leads;

-- 4. Create RLS Policies using runtime session variables:
--    - app.is_super_admin = 'true' (Super Admin access)
--    - app.current_tenant_id = '<UUID>' (Tenant-scoped isolation)

CREATE POLICY org_tenant_isolation ON organizations
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

CREATE POLICY page_mappings_tenant_isolation ON page_mappings
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

CREATE POLICY lead_forms_tenant_isolation ON lead_forms
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

CREATE POLICY leads_tenant_isolation ON leads
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

CREATE POLICY audit_logs_super_admin_only ON audit_logs
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
    );

CREATE POLICY unmapped_leads_super_admin_only ON unmapped_leads
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
    );




