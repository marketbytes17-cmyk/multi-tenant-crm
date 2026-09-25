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
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

client = TestClient(app)

def test_security_hashing():
    print("=" * 70)
    print("      JWT Security & Password Hashing Unit Verification")
    print("=" * 70)

    password = "SuperSecretPassword123!"
    hashed = get_password_hash(password)
    
    assert verify_password(password, hashed), "Password verification failed for correct password"
    assert not verify_password("WrongPassword!", hashed), "Password verification passed for invalid password"
    print("[OK] Password bcrypt hashing & verification passed.")

def test_jwt_token_claims():
    user_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    token = create_access_token(subject=user_id, organization_id=org_id, role="CLIENT_ADMIN")

    decoded = decode_access_token(token)
    assert decoded["sub"] == user_id, f"Expected sub {user_id}, got {decoded.get('sub')}"
    assert decoded["org_id"] == org_id, f"Expected org_id {org_id}, got {decoded.get('org_id')}"
    assert decoded["role"] == "CLIENT_ADMIN", f"Expected role CLIENT_ADMIN, got {decoded.get('role')}"
    print("[OK] JWT token generation & claims decoding passed.")

def test_auth_api_routes():
    # Ensure tables exist in SQLite/Postgres for test execution
    Base.metadata.create_all(bind=engine)

    test_email = f"user_{uuid.uuid4().hex[:6]}@agency.com"
    test_password = "SecurePassword2026!"

    # 1. Register User
    reg_response = client.post(
        "/api/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "Test Agency Admin",
            "role": "CLIENT_ADMIN"
        }
    )
    assert reg_response.status_code == 201, f"Registration failed: {reg_response.text}"
    user_data = reg_response.json()
    assert user_data["email"] == test_email
    assert user_data["role"] == "CLIENT_ADMIN"
    print(f"[OK] Registration endpoint POST /api/auth/register passed (User ID: {user_data['id'][:8]}...).")

    # 2. Login via JSON
    login_res = client.post(
        "/api/auth/login/json",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    access_token = token_data["access_token"]
    print("[OK] Login endpoint POST /api/auth/login/json passed.")

    # 3. Access Protected /me Route
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me_res.status_code == 200, f"Protected /me endpoint failed: {me_res.text}"
    me_data = me_res.json()
    assert me_data["email"] == test_email
    print("[OK] Protected profile endpoint GET /api/auth/me passed.")

    print("\n" + "=" * 70)
    print("SUCCESS: ALL JWT AUTHENTICATION & SECURITY TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    test_security_hashing()
    test_jwt_token_claims()
    test_auth_api_routes()
