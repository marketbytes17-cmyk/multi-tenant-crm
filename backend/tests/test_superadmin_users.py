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

def test_superadmin_user_management():
    print("=" * 70)
    print("      Super Admin Client Users Management Unit Verification")
    print("=" * 70)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Register Super Admin
    sa_email = f"superadmin_{uuid.uuid4().hex[:6]}@agency.com"
    sa_pwd = "SuperPassword123!"

    client.post(
        "/api/auth/register",
        json={"email": sa_email, "password": sa_pwd, "full_name": "Super Admin", "role": "SUPER_ADMIN"}
    )
    sa_token = client.post("/api/auth/login/json", json={"email": sa_email, "password": sa_pwd}).json()["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}

    # 2. Register Client Admin User
    ca_email = f"clientadmin_{uuid.uuid4().hex[:6]}@apexdesign.com"
    ca_pwd = "ClientPassword123!"

    ca_reg = client.post(
        "/api/auth/register",
        json={"email": ca_email, "password": ca_pwd, "full_name": "Sarah Jenkins", "role": "CLIENT_ADMIN"}
    )
    assert ca_reg.status_code == 201
    target_user_id = ca_reg.json()["id"]

    # 3. GET /api/superadmin/users
    users_res = client.get("/api/superadmin/users", headers=sa_headers)
    assert users_res.status_code == 200, f"GET users failed: {users_res.text}"
    users_list = users_res.json()
    assert len(users_list) >= 1
    assert users_list[0]["email"] == ca_email
    print(f"[OK] GET /api/superadmin/users returned {len(users_list)} Client Admin user(s).")

    # 4. POST /api/superadmin/users/{id}/reset-password
    reset_res = client.post(f"/api/superadmin/users/{target_user_id}/reset-password", headers=sa_headers)
    assert reset_res.status_code == 200, f"Reset password failed: {reset_res.text}"
    assert reset_res.json()["success"] is True
    assert "resetLink" in reset_res.json()
    print(f"[OK] POST /api/superadmin/users/{target_user_id[:8]}.../reset-password generated reset link.")

    # 5. POST /api/superadmin/users/{id}/deactivate
    deact_res = client.post(f"/api/superadmin/users/{target_user_id}/deactivate", headers=sa_headers)
    assert deact_res.status_code == 200, f"Deactivate failed: {deact_res.text}"
    assert deact_res.json()["status"] == "inactive"
    print(f"[OK] POST /api/superadmin/users/{target_user_id[:8]}.../deactivate toggled user status to inactive.")

    print("=" * 70)
    print("SUCCESS: SUPER ADMIN CLIENT USERS ENDPOINTS VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    test_superadmin_user_management()
