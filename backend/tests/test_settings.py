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

def test_settings_endpoints():
    print("=" * 70)
    print("      Settings Endpoints (Super Admin, Client, Rep) Unit Verification")
    print("=" * 70)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Super Admin Settings Test
    sa_email = f"superadmin_{uuid.uuid4().hex[:6]}@agency.com"
    sa_pwd = "SuperPassword123!"

    client.post(
        "/api/auth/register",
        json={"email": sa_email, "password": sa_pwd, "full_name": "Super Admin", "role": "SUPER_ADMIN"}
    )
    sa_token = client.post("/api/auth/login/json", json={"email": sa_email, "password": sa_pwd}).json()["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}

    sa_get_res = client.get("/api/superadmin/settings", headers=sa_headers)
    assert sa_get_res.status_code == 200, f"GET superadmin settings failed: {sa_get_res.text}"
    assert sa_get_res.json()["platformName"] == "Market Bytes CRM"
    print("[OK] GET /api/superadmin/settings returned initial default platform config.")

    sa_patch_res = client.patch(
        "/api/superadmin/settings",
        json={"platformName": "Market Bytes Enterprise CRM", "defaultNotifyOnNewLead": False},
        headers=sa_headers
    )
    assert sa_patch_res.status_code == 200, f"PATCH superadmin settings failed: {sa_patch_res.text}"
    assert sa_patch_res.json()["platformName"] == "Market Bytes Enterprise CRM"
    assert sa_patch_res.json()["defaultNotifyOnNewLead"] is False
    print("[OK] PATCH /api/superadmin/settings successfully updated configuration.")

    # 2. Client Admin Settings Test
    ca_email = f"clientadmin_{uuid.uuid4().hex[:6]}@apexdesign.com"
    ca_pwd = "ClientPassword123!"

    org_res = client.post(
        "/api/organizations",
        json={"name": "Apex Design Co.", "status": "ACTIVE"},
        headers=sa_headers
    )
    assert org_res.status_code == 201, f"Org creation failed: {org_res.text}"
    org_id = org_res.json()["id"]

    ca_reg = client.post(
        "/api/auth/register",
        json={"email": ca_email, "password": ca_pwd, "full_name": "Apex Admin", "role": "CLIENT_ADMIN", "organization_id": org_id}
    )
    assert ca_reg.status_code == 201
    ca_token = client.post("/api/auth/login/json", json={"email": ca_email, "password": ca_pwd}).json()["access_token"]
    ca_headers = {"Authorization": f"Bearer {ca_token}"}

    ca_get_res = client.get("/api/client/settings", headers=ca_headers)
    assert ca_get_res.status_code == 200, f"GET client settings failed: {ca_get_res.text}"
    print("[OK] GET /api/client/settings returned organization defaults.")

    ca_patch_res = client.patch(
        "/api/client/settings",
        json={"orgName": "Apex Digital Corp", "leadAssignmentMode": "round-robin"},
        headers=ca_headers
    )
    assert ca_patch_res.status_code == 200, f"PATCH client settings failed: {ca_patch_res.text}"
    assert ca_patch_res.json()["orgName"] == "Apex Digital Corp"
    assert ca_patch_res.json()["leadAssignmentMode"] == "round-robin"
    print("[OK] PATCH /api/client/settings updated tenant settings and organization name.")

    # 3. Sales Rep Settings Test
    rep_invite = client.post(
        "/api/team/invite",
        json={"email": f"rep_{uuid.uuid4().hex[:6]}@apexdesign.com", "password": "RepPassword123!", "full_name": "Johnny Rep"},
        headers=ca_headers
    )
    assert rep_invite.status_code == 201
    rep_email = rep_invite.json()["email"]
    rep_token = client.post("/api/auth/login/json", json={"email": rep_email, "password": "RepPassword123!"}).json()["access_token"]
    rep_headers = {"Authorization": f"Bearer {rep_token}"}

    rep_get_res = client.get("/api/rep/settings", headers=rep_headers)
    assert rep_get_res.status_code == 200, f"GET rep settings failed: {rep_get_res.text}"
    print("[OK] GET /api/rep/settings returned personal preferences.")

    rep_patch_res = client.patch(
        "/api/rep/settings",
        json={"name": "Johnny Sales Rep", "dailyDigest": True},
        headers=rep_headers
    )
    assert rep_patch_res.status_code == 200, f"PATCH rep settings failed: {rep_patch_res.text}"
    assert rep_patch_res.json()["name"] == "Johnny Sales Rep"
    assert rep_patch_res.json()["dailyDigest"] is True
    print("[OK] PATCH /api/rep/settings updated sales rep profile and notification preferences.")

    print("=" * 70)
    print("SUCCESS: ALL SETTINGS ENDPOINTS VERIFIED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_settings_endpoints()
