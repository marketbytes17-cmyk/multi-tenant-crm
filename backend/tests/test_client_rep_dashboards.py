import os
import sys
import uuid
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, engine

client = TestClient(app)

def test_client_rep_dashboards_and_lead_actions():
    print("=" * 70)
    print("   Client Admin & Sales Rep Dashboards + Lead Actions Unit Test")
    print("=" * 70)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


    # 1. Register Client Admin & Org
    client_email = f"clientadmin_{uuid.uuid4().hex[:6]}@apexdesign.com"
    client_pwd = "ClientAdminPassword123!"

    # Create Organization first
    org_res = client.post(
        "/api/organizations",
        json={"name": "Apex Design Co.", "status": "ACTIVE"}
    )
    # Organization endpoint requires Super Admin, so let's register Super Admin first
    sa_email = f"superadmin_{uuid.uuid4().hex[:6]}@agency.com"
    sa_pwd = "SuperPassword123!"

    sa_reg = client.post(
        "/api/auth/register",
        json={"email": sa_email, "password": sa_pwd, "full_name": "Super Admin", "role": "SUPER_ADMIN"}
    )
    sa_token = client.post("/api/auth/login/json", json={"email": sa_email, "password": sa_pwd}).json()["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}

    org_res = client.post(
        "/api/organizations",
        json={"name": "Apex Design Co.", "status": "ACTIVE"},
        headers=sa_headers
    )
    assert org_res.status_code == 201, f"Org creation failed: {org_res.text}"
    org_id = org_res.json()["id"]

    # Register Client Admin under org_id
    ca_reg = client.post(
        "/api/auth/register",
        json={"email": client_email, "password": client_pwd, "full_name": "Sarah Jenkins", "role": "CLIENT_ADMIN", "organization_id": org_id}
    )
    assert ca_reg.status_code == 201, f"Client admin reg failed: {ca_reg.text}"
    ca_token = client.post("/api/auth/login/json", json={"email": client_email, "password": client_pwd}).json()["access_token"]
    ca_headers = {"Authorization": f"Bearer {ca_token}"}

    # 2. Client Admin Dashboard Summary
    dash_res = client.get("/api/client/dashboard-summary", headers=ca_headers)
    assert dash_res.status_code == 200, f"Client dash summary failed: {dash_res.text}"
    dash_data = dash_res.json()
    assert "newLeadsToday" in dash_data
    assert "unassignedCount" in dash_data
    assert "stageFunnel" in dash_data
    print("[OK] GET /api/client/dashboard-summary returned valid structure.")

    # 3. Invite Sales Rep via Team Endpoint
    rep_email = f"rep_{uuid.uuid4().hex[:6]}@apexdesign.com"
    rep_pwd = "RepPassword123!"
    invite_res = client.post(
        "/api/team/invite",
        json={"email": rep_email, "password": rep_pwd, "full_name": "Michael Scott", "role": "SALES_REP"},
        headers=ca_headers
    )
    assert invite_res.status_code == 201, f"Team invite failed: {invite_res.text}"
    rep_id = invite_res.json()["id"]
    print(f"[OK] POST /api/team/invite created sales rep ID: {rep_id[:8]}...")

    # 4. Create Lead and Assign to Rep
    lead_res = client.post(
        "/api/leads",
        json={
            "leadgen_id": f"lg_{uuid.uuid4().hex[:8]}",
            "contact_name": "Robert Fox",
            "contact_phone": "+1 555-019-2834",
            "contact_email": "robert@example.com",
            "status": "NEW"
        },
        headers=ca_headers
    )
    assert lead_res.status_code == 201, f"Lead creation failed: {lead_res.text}"
    lead_id = lead_res.json()["id"]

    assign_res = client.post(
        f"/api/leads/{lead_id}/assign",
        json={"rep_id": rep_id},
        headers=ca_headers
    )
    assert assign_res.status_code == 200, f"Lead assign failed: {assign_res.text}"
    assert assign_res.json()["assigned_user_id"] == rep_id
    print(f"[OK] POST /api/leads/{lead_id[:8]}.../assign assigned lead to rep.")

    # 5. Append Note to Lead
    note_res = client.post(
        f"/api/leads/{lead_id}/notes",
        json={"content": "Left voicemail for client."},
        headers=ca_headers
    )
    assert note_res.status_code == 200, f"Add note failed: {note_res.text}"
    assert "Left voicemail" in note_res.json()["notes"]
    print(f"[OK] POST /api/leads/{lead_id[:8]}.../notes appended note.")

    # 6. Sales Rep Login & Dashboard Summary
    rep_token = client.post("/api/auth/login/json", json={"email": rep_email, "password": rep_pwd}).json()["access_token"]
    rep_headers = {"Authorization": f"Bearer {rep_token}"}

    rep_dash = client.get("/api/rep/dashboard-summary", headers=rep_headers)
    assert rep_dash.status_code == 200, f"Rep dashboard failed: {rep_dash.text}"
    rep_dash_data = rep_dash.json()
    assert rep_dash_data["assignedLeadsCount"] == 1
    print("[OK] GET /api/rep/dashboard-summary returned personal metrics.")

    print("=" * 70)
    print("SUCCESS: CLIENT & SALES REP ENDPOINTS VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_client_rep_dashboards_and_lead_actions()
