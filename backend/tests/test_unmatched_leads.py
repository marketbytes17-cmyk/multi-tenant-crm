import os
import sys
import uuid
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, engine, get_db
from app.models.models import UnmappedLead, Organization

client = TestClient(app)

def test_unmatched_leads_and_manual_assign():
    print("=" * 70)
    print("      Unmatched Leads & Manual Assign Unit Verification")
    print("=" * 70)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Register Super Admin
    sa_email = f"superadmin_{uuid.uuid4().hex[:6]}@agency.com"
    sa_pwd = "SuperPassword123!"

    sa_reg = client.post(
        "/api/auth/register",
        json={"email": sa_email, "password": sa_pwd, "full_name": "Super Admin", "role": "SUPER_ADMIN"}
    )
    sa_token = client.post("/api/auth/login/json", json={"email": sa_email, "password": sa_pwd}).json()["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}

    # 2. Create Target Organization
    org_res = client.post(
        "/api/organizations",
        json={"name": "Nexus Solar Solutions", "status": "ACTIVE"},
        headers=sa_headers
    )
    assert org_res.status_code == 201
    target_org_id = org_res.json()["id"]

    # 3. Seed an UnmappedLead in database
    db = next(get_db())
    unmapped_id = str(uuid.uuid4())
    unmapped_lead = UnmappedLead(
        id=unmapped_id,
        page_id="998877665544332",
        form_id="form_99",
        leadgen_id=f"lg_unmatched_{uuid.uuid4().hex[:6]}",
        error_reason="UNMAPPED_PAGE",
        raw_payload={
            "form_id": "form_99",
            "page_id": "998877665544332",
            "field_data": [
                {"name": "full_name", "values": ["Jonathan Miller"]},
                {"name": "phone_number", "values": ["+1 555 888 1122"]}
            ]
        },
        status="UNMAPPED"
    )
    db.add(unmapped_lead)
    db.commit()

    # 4. GET /api/superadmin/leads/unmatched
    unmatched_res = client.get("/api/superadmin/leads/unmatched", headers=sa_headers)
    assert unmatched_res.status_code == 200, f"Get unmatched leads failed: {unmatched_res.text}"
    unmatched_list = unmatched_res.json()
    assert len(unmatched_list) >= 1
    assert unmatched_list[0]["leadName"] == "Jonathan Miller"
    print(f"[OK] GET /api/superadmin/leads/unmatched returned {len(unmatched_list)} unmatched lead(s).")

    # 5. POST /api/superadmin/leads/{id}/manual-assign
    assign_res = client.post(
        f"/api/superadmin/leads/{unmapped_id}/manual-assign",
        json={"clientId": target_org_id},
        headers=sa_headers
    )
    assert assign_res.status_code == 200, f"Manual assign failed: {assign_res.text}"
    assert assign_res.json()["success"] is True
    print(f"[OK] POST /api/superadmin/leads/{unmapped_id[:8]}.../manual-assign successfully assigned lead.")

    # 6. Verify unmapped list is now empty (status RESOLVED)
    after_res = client.get("/api/superadmin/leads/unmatched", headers=sa_headers)
    assert len(after_res.json()) == 0
    print("[OK] Verified unmapped lead is marked RESOLVED and removed from unmatched inbox.")

    print("=" * 70)
    print("SUCCESS: UNMATCHED LEADS & MANUAL ASSIGN ENDPOINTS VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_unmatched_leads_and_manual_assign()
