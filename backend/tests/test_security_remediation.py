import os
import sys
import uuid
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.models.models import Organization, User, AuditLog
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

def run_security_remediation_tests():
    print("=" * 70)
    print("      SECURITY REMEDIATION VERIFICATION SUITE")
    print("=" * 70)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create test organization
        org = Organization(name=f"Sec Test Org {uuid.uuid4().hex[:6]}")
        db.add(org)
        db.commit()
        db.refresh(org)

        # Create test users
        super_admin = User(
            email=f"super_{uuid.uuid4().hex[:6]}@agency.com",
            hashed_password=get_password_hash("SuperPass123!"),
            full_name="Super Admin User",
            role="SUPER_ADMIN",
            is_active=True
        )
        client_admin = User(
            organization_id=org.id,
            email=f"cadmin_{uuid.uuid4().hex[:6]}@agency.com",
            hashed_password=get_password_hash("ClientAdminPass123!"),
            full_name="Client Admin User",
            role="CLIENT_ADMIN",
            is_active=True
        )
        sales_rep = User(
            organization_id=org.id,
            email=f"srep_{uuid.uuid4().hex[:6]}@agency.com",
            hashed_password=get_password_hash("SalesRepPass123!"),
            full_name="Sales Rep User",
            role="SALES_REP",
            is_active=True
        )
        db.add_all([super_admin, client_admin, sales_rep])
        db.commit()

        super_token = create_access_token(subject=str(super_admin.id), organization_id=None, role="SUPER_ADMIN")
        cadmin_token = create_access_token(subject=str(client_admin.id), organization_id=str(org.id), role="CLIENT_ADMIN")
        srep_token = create_access_token(subject=str(sales_rep.id), organization_id=str(org.id), role="SALES_REP")

        # -------------------------------------------------------------
        # 1. Verification of A4 — Public registration route deleted
        # -------------------------------------------------------------
        res_a4 = client.post("/api/auth/register", json={"email": "hacker@evil.com", "password": "pass", "full_name": "Hacker", "role": "SUPER_ADMIN"})
        assert res_a4.status_code == 404, f"Expected 404 for /auth/register, got {res_a4.status_code}"
        print("[PASS] A4: Public /auth/register route returns 404 (route deleted).")

        # -------------------------------------------------------------
        # 2. Verification of B6 — /organizations and /page-mappings role checks
        # -------------------------------------------------------------
        res_b6_rep_org = client.get("/api/organizations", headers={"Authorization": f"Bearer {srep_token}"})
        assert res_b6_rep_org.status_code == 403, f"Expected 403 for sales_rep on /organizations, got {res_b6_rep_org.status_code}"

        res_b6_rep_pm = client.get("/api/page-mappings", headers={"Authorization": f"Bearer {srep_token}"})
        assert res_b6_rep_pm.status_code == 403, f"Expected 403 for sales_rep on /page-mappings, got {res_b6_rep_pm.status_code}"

        res_b6_super_org = client.get("/api/organizations", headers={"Authorization": f"Bearer {super_token}"})
        assert res_b6_super_org.status_code == 200, f"Expected 200 for super_admin on /organizations, got {res_b6_super_org.status_code}"

        res_b6_super_pm = client.get("/api/page-mappings", headers={"Authorization": f"Bearer {super_token}"})
        assert res_b6_super_pm.status_code == 200, f"Expected 200 for super_admin on /page-mappings, got {res_b6_super_pm.status_code}"
        print("[PASS] B6: /organizations and /page-mappings correctly return 403 for sales_rep and 200 for super_admin.")

        # -------------------------------------------------------------
        # 3. Verification of B7 — /team and /team/invite role checks
        # -------------------------------------------------------------
        res_b7_rep_list = client.get("/api/team", headers={"Authorization": f"Bearer {srep_token}"})
        assert res_b7_rep_list.status_code == 403, f"Expected 403 for sales_rep on GET /team, got {res_b7_rep_list.status_code}"

        res_b7_rep_invite = client.post("/api/team/invite", json={"email": "newrep@agency.com", "password": "pass", "full_name": "New Rep"}, headers={"Authorization": f"Bearer {srep_token}"})
        assert res_b7_rep_invite.status_code == 403, f"Expected 403 for sales_rep on POST /team/invite, got {res_b7_rep_invite.status_code}"

        res_b7_ca_list = client.get("/api/team", headers={"Authorization": f"Bearer {cadmin_token}"})
        assert res_b7_ca_list.status_code == 200, f"Expected 200 for client_admin on GET /team, got {res_b7_ca_list.status_code}"

        invited_email = f"invited_{uuid.uuid4().hex[:6]}@agency.com"
        res_b7_ca_invite = client.post("/api/team/invite", json={"email": invited_email, "password": "SecurePassword123!", "full_name": "Invited Rep"}, headers={"Authorization": f"Bearer {cadmin_token}"})
        assert res_b7_ca_invite.status_code == 201, f"Expected 201 for client_admin on POST /team/invite, got {res_b7_ca_invite.status_code}"
        print("[PASS] B7: /team and /team/invite return 403 for sales_rep and 200/201 for client_admin.")

        # -------------------------------------------------------------
        # 4. Verification of E19 — AuditLog entry on team invite
        # -------------------------------------------------------------
        audit_row = db.query(AuditLog).filter(AuditLog.action == "INVITE_TEAM_MEMBER", AuditLog.actor_id == client_admin.id).first()
        assert audit_row is not None, "Expected AuditLog entry for team invitation"
        assert audit_row.details.get("invited_email") == invited_email
        print("[PASS] E19: Team invitation successfully creates an AuditLog record.")

        # -------------------------------------------------------------
        # 5. Verification of A3 — Generic error on login
        # -------------------------------------------------------------
        res_a3_wrong = client.post("/api/auth/login/json", json={"email": "nonexistent@agency.com", "password": "wrong"})
        assert res_a3_wrong.status_code == 401
        assert res_a3_wrong.json()["detail"] == "Incorrect email or password"

        # Deactivate sales_rep user
        sales_rep.is_active = False
        db.commit()

        res_a3_inactive = client.post("/api/auth/login/json", json={"email": sales_rep.email, "password": "SalesRepPass123!"})
        assert res_a3_inactive.status_code == 401
        assert res_a3_inactive.json()["detail"] == "Incorrect email or password"
        print("[PASS] A3: Login returns identical 401 'Incorrect email or password' for invalid or inactive user.")

        print("\n" + "=" * 70)
        print("ALL SECURITY REMEDIATION VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_security_remediation_tests()
