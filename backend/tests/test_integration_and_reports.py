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

def test_integration_and_reports():
    print("=" * 70)
    print("      Meta Integration Health & Analytics Reports Unit Verification")
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

    # 2. Test GET /api/superadmin/integration/status
    status_res = client.get("/api/superadmin/integration/status", headers=sa_headers)
    assert status_res.status_code == 200, f"Status failed: {status_res.text}"
    status_data = status_res.json()
    assert status_data["tokenStatus"] == "valid"
    assert status_data["metaConnectionHealthy"] is True
    print("[OK] GET /api/superadmin/integration/status returned healthy status.")

    # 3. Test POST /api/superadmin/integration/test-lead
    test_lead_res = client.post("/api/superadmin/integration/test-lead", headers=sa_headers)
    assert test_lead_res.status_code == 200, f"Test lead simulation failed: {test_lead_res.text}"
    assert test_lead_res.json()["success"] is True
    print("[OK] POST /api/superadmin/integration/test-lead simulated lead webhook.")

    # 4. Create Organization & Client Admin
    org_res = client.post(
        "/api/organizations",
        json={"name": "Crestview Real Estate", "status": "ACTIVE"},
        headers=sa_headers
    )
    org_id = org_res.json()["id"]

    ca_email = f"clientadmin_{uuid.uuid4().hex[:6]}@crestviewre.com"
    ca_pwd = "ClientPassword123!"
    client.post(
        "/api/auth/register",
        json={"email": ca_email, "password": ca_pwd, "full_name": "Emily Watson", "role": "CLIENT_ADMIN", "organization_id": org_id}
    )
    ca_token = client.post("/api/auth/login/json", json={"email": ca_email, "password": ca_pwd}).json()["access_token"]
    ca_headers = {"Authorization": f"Bearer {ca_token}"}

    # 5. Test GET /api/superadmin/reports
    sa_reports_res = client.get("/api/superadmin/reports", headers=sa_headers)
    assert sa_reports_res.status_code == 200, f"Superadmin reports failed: {sa_reports_res.text}"
    sa_rep_data = sa_reports_res.json()
    assert "leadsByClient" in sa_rep_data
    assert "conversionByClient" in sa_rep_data
    print("[OK] GET /api/superadmin/reports returned global agency analytics.")

    # 6. Test GET /api/client/reports
    client_reports_res = client.get("/api/client/reports", headers=ca_headers)
    assert client_reports_res.status_code == 200, f"Client reports failed: {client_reports_res.text}"
    client_rep_data = client_reports_res.json()
    assert "performanceOverTime" in client_rep_data
    assert "repPerformance" in client_rep_data
    print("[OK] GET /api/client/reports returned tenant performance charts.")

    # 7. Test GET /api/rep/performance
    rep_email = f"rep_{uuid.uuid4().hex[:6]}@crestviewre.com"
    rep_pwd = "RepPassword123!"
    client.post(
        "/api/auth/register",
        json={"email": rep_email, "password": rep_pwd, "full_name": "Jim Halpert", "role": "SALES_REP", "organization_id": org_id}
    )
    rep_token = client.post("/api/auth/login/json", json={"email": rep_email, "password": rep_pwd}).json()["access_token"]
    rep_headers = {"Authorization": f"Bearer {rep_token}"}

    rep_perf_res = client.get("/api/rep/performance", headers=rep_headers)
    assert rep_perf_res.status_code == 200, f"Rep performance failed: {rep_perf_res.text}"
    rep_perf_data = rep_perf_res.json()
    assert "performanceTrend" in rep_perf_data
    print("[OK] GET /api/rep/performance returned rep personal performance trend.")

    print("=" * 70)
    print("SUCCESS: INTEGRATION STATUS & ANALYTICS REPORTS VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_integration_and_reports()
