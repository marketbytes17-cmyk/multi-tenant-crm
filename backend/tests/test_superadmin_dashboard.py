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
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

def test_superadmin_dashboard_summary():
    print("=" * 70)
    print("      Super Admin Dashboard Summary Endpoint Unit Verification")
    print("=" * 70)

    # 1. Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Register Super Admin User
    admin_email = f"superadmin_{uuid.uuid4().hex[:6]}@agency.com"
    admin_password = "SuperAdminPassword123!"

    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": admin_email,
            "password": admin_password,
            "full_name": "Agency Super Admin",
            "role": "SUPER_ADMIN"
        }
    )
    assert reg_res.status_code == 201, f"Super Admin registration failed: {reg_res.text}"

    # 3. Login to get JWT Token
    login_res = client.post(
        "/api/auth/login/json",
        json={
            "email": admin_email,
            "password": admin_password
        }
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    access_token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}

    # 4. GET /api/superadmin/dashboard-summary
    res = client.get("/api/superadmin/dashboard-summary", headers=headers)
    assert res.status_code == 200, f"Dashboard summary failed: {res.text}"
    
    data = res.json()
    assert "totalLeadsToday" in data
    assert "totalLeadsWeek" in data
    assert "totalLeadsMonth" in data
    assert "activeClientsCount" in data
    assert "totalAdSpendMonth" in data
    assert "systemStatus" in data
    assert data["systemStatus"]["metaConnection"] in ["healthy", "down"]
    assert "leadsOverTime" in data
    assert isinstance(data["leadsOverTime"], list)
    assert len(data["leadsOverTime"]) == 7
    assert "recentActivity" in data
    assert isinstance(data["recentActivity"], list)

    print("[OK] Endpoint GET /api/superadmin/dashboard-summary returned valid response structure:")
    print(f"     - Leads Today: {data['totalLeadsToday']}")
    print(f"     - Active Clients: {data['activeClientsCount']}")
    print(f"     - System Status: {data['systemStatus']['metaConnection']}")
    print(f"     - Leads Over Time Count: {len(data['leadsOverTime'])}")

    # 5. GET /api/admin/dashboard-summary alias
    res_alias = client.get("/api/admin/dashboard-summary", headers=headers)
    assert res_alias.status_code == 200, f"Dashboard summary alias failed: {res_alias.text}"

    print("[OK] Endpoint alias GET /api/admin/dashboard-summary passed.")
    print("=" * 70)
    print("SUCCESS: SUPER ADMIN DASHBOARD SUMMARY ENDPOINT VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_superadmin_dashboard_summary()
