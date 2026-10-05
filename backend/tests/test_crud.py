import os
import sys
import uuid
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv()

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, engine
from app.core.security import create_access_token

client = TestClient(app)

def test_full_crud_and_impersonation_workflow():
    print("=" * 70)
    print("      FastAPI Full CRUD APIs & Impersonation Workflow Test")
    print("=" * 70)

    # Ensure fresh clean test database state
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


    # 1. Register Super Admin User
    admin_email = f"superadmin_{uuid.uuid4().hex[:6]}@marketbytes.com"
    admin_reg = client.post(
        "/api/auth/register",
        json={
            "email": admin_email,
            "password": "SuperAdminSecret123!",
            "full_name": "Market Bytes Admin",
            "role": "SUPER_ADMIN"
        }
    )
    assert admin_reg.status_code == 201, f"Admin reg failed: {admin_reg.text}"
    admin_user = admin_reg.json()

    # Login Super Admin to get token
    admin_login = client.post(
        "/api/auth/login/json",
        json={"email": admin_email, "password": "SuperAdminSecret123!"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Provision Client Tenant Organization via SUPER_ADMIN
    org_res = client.post(
        "/api/organizations",
        json={
            "name": "Apex Digital Marketing",
            "primary_contact_name": "John Doe",
            "primary_contact_email": "john@apexdigital.com",
            "status": "ACTIVE"
        },
        headers=admin_headers
    )
    assert org_res.status_code == 201, f"Org creation failed: {org_res.text}"
    org_data = org_res.json()
    org_id = org_data["id"]
    print(f"[OK] Organization provisioning passed (Org ID: {org_id[:8]}...).")

    # 3. Register Client Admin for Apex Digital
    client_email = f"admin_{uuid.uuid4().hex[:6]}@apexdigital.com"
    client_reg = client.post(
        "/api/auth/register",
        json={
            "email": client_email,
            "password": "ClientPassword123!",
            "full_name": "Apex Client Admin",
            "role": "CLIENT_ADMIN",
            "organization_id": org_id
        }
    )
    assert client_reg.status_code == 201
    
    client_login = client.post(
        "/api/auth/login/json",
        json={"email": client_email, "password": "ClientPassword123!"}
    )
    client_token = client_login.json()["access_token"]
    client_headers = {"Authorization": f"Bearer {client_token}"}

    # 4. Connect Facebook Page Mapping
    page_res = client.post(
        "/api/page-mappings",
        json={
            "organization_id": org_id,
            "page_id": f"page_{uuid.uuid4().hex[:8]}",
            "page_name": "Apex Official FB Page",
            "page_url": "https://facebook.com/apexdigital"
        },
        headers=admin_headers
    )
    assert page_res.status_code == 201, f"Page mapping failed: {page_res.text}"
    page_data = page_res.json()
    print(f"[OK] Page mapping created (Page ID: {page_data['page_id']}).")

    # 5. Create Lead under Tenant
    lead_gen_id = f"leadgen_{uuid.uuid4().hex[:8]}"
    lead_res = client.post(
        "/api/leads",
        json={
            "organization_id": org_id,
            "leadgen_id": lead_gen_id,
            "contact_name": "Michael Scott",
            "contact_email": "michael@dundermifflin.com",
            "contact_phone": "+15551234567",
            "custom_fields": {"budget": "$50,000", "interest": "SEO Audit"},
            "status": "NEW",
            "notes": "Requested immediate callback"
        },
        headers=client_headers
    )
    assert lead_res.status_code == 201, f"Lead creation failed: {lead_res.text}"
    lead_data = lead_res.json()
    lead_id = lead_data["id"]
    print(f"[OK] Lead creation passed (Lead ID: {lead_id[:8]}...).")

    # 6. Update Lead Status in Kanban Pipeline (NEW -> CONTACTED)
    kanban_res = client.patch(
        f"/api/leads/{lead_id}/status",
        json={"status": "CONTACTED"},
        headers=client_headers
    )
    assert kanban_res.status_code == 200, f"Kanban status update failed: {kanban_res.text}"
    assert kanban_res.json()["status"] == "CONTACTED"
    print("[OK] Kanban pipeline drag-and-drop status update (NEW -> CONTACTED) passed.")

    # 7. List Leads with Status Filter
    list_res = client.get("/api/leads?status=CONTACTED", headers=client_headers)
    assert list_res.status_code == 200, f"List leads failed: {list_res.text}"
    print(f"[DEBUG] List leads response: {list_res.json()}")
    assert list_res.json()["total"] == 1

    print("[OK] Kanban status column filtering passed.")

    # 8. Super Admin Impersonation of Tenant
    imp_res = client.post(
        f"/api/admin/impersonate/{org_id}",
        headers=admin_headers
    )
    assert imp_res.status_code == 200, f"Impersonation failed: {imp_res.text}"
    imp_token = imp_res.json()["access_token"]
    imp_headers = {"Authorization": f"Bearer {imp_token}"}
    print("[OK] Super Admin tenant impersonation token generated.")

    # Verify impersonated token can read tenant leads
    imp_leads = client.get("/api/leads", headers=imp_headers)
    assert imp_leads.status_code == 200
    assert imp_leads.json()["total"] == 1
    print("[OK] Impersonated portal access verified.")

    # 9. Verify Audit Log entry for Impersonation
    audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    assert len(audit_logs) >= 1
    assert audit_logs[0]["action"] == "IMPERSONATE_TENANT"
    print("[OK] Security Audit Log entry verified.")

    print("\n" + "=" * 70)
    print("SUCCESS: ALL FASTAPI CRUD & IMPERSONATION WORKFLOW TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_crud_and_impersonation_workflow()
