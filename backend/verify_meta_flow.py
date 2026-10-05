from fastapi.testclient import TestClient
from app.main import app
import json, hmac, hashlib

client = TestClient(app)

# 1. Test webhook GET verification
print("=== 1. Webhook GET Verification ===")
r = client.get("/api/webhooks/meta", params={
    "hub.mode": "subscribe",
    "hub.verify_token": "crm_meta_verify_8f2a9c1e4b7d6053e1a8",
    "hub.challenge": "test_challenge_123"
})
print(f"Status: {r.status_code}")
print(f"Body: {r.text}")
print(f"Challenge returned: {r.text == 'test_challenge_123'}")

# 2. Test webhook POST with valid signature
print("\n=== 2. Webhook POST with Valid Signature ===")
payload = {
    "object": "page",
    "entry": [{
        "id": "109283746554321",
        "time": 1695000000,
        "changes": [{
            "field": "leadgen",
            "value": {
                "page_id": "109283746554321",
                "leadgen_id": "test_lead_001",
                "form_id": "form_demo_lead_gen_2026"
            }
        }]
    }]
}
body = json.dumps(payload).encode("utf-8")
secret = "74a5b9b78a98d470d56d9fc4473637f8"
signature = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

r = client.post("/api/webhooks/meta",
    content=body,
    headers={"X-Hub-Signature-256": signature, "Content-Type": "application/json"}
)
print(f"Status: {r.status_code}")
print(f"Response: {r.json()}")

# 3. Test webhook POST with invalid signature
print("\n=== 3. Webhook POST with Invalid Signature ===")
r = client.post("/api/webhooks/meta",
    content=body,
    headers={"X-Hub-Signature-256": "sha256=invalid", "Content-Type": "application/json"}
)
print(f"Status: {r.status_code} (should be 401)")

# 4. Test webhook POST with unmapped page
print("\n=== 4. Webhook POST with Unmapped Page ===")
payload2 = {
    "object": "page",
    "entry": [{
        "id": "999999999999999",
        "time": 1695000000,
        "changes": [{
            "field": "leadgen",
            "value": {
                "page_id": "999999999999999",
                "leadgen_id": "test_lead_unmapped",
                "form_id": "form_unknown"
            }
        }]
    }]
}
body2 = json.dumps(payload2).encode("utf-8")
signature2 = "sha256=" + hmac.new(secret.encode(), body2, hashlib.sha256).hexdigest()
r = client.post("/api/webhooks/meta",
    content=body2,
    headers={"X-Hub-Signature-256": signature2, "Content-Type": "application/json"}
)
print(f"Status: {r.status_code}")
print(f"Response: {r.json()}")

# 5. Verify lead was created in database
print("\n=== 5. Verify Lead in Database ===")
from app.db.database import SessionLocal
from app.models.models import Lead, UnmappedLead
db = SessionLocal()
leads = db.query(Lead).filter(Lead.leadgen_id == "test_lead_001").all()
print(f"Leads found: {len(leads)}")
for lead in leads:
    print(f"  Lead: {lead.contact_name} | Org: {lead.organization_id} | Status: {lead.status}")

unmapped = db.query(UnmappedLead).filter(UnmappedLead.leadgen_id == "test_lead_unmapped").all()
print(f"Unmapped leads found: {len(unmapped)}")
for u in unmapped:
    print(f"  Unmapped: {u.leadgen_id} | Page: {u.page_id} | Status: {u.status}")
db.close()

# 6. Test login and check leads via API
print("\n=== 6. Test Login & Leads API ===")
r = client.post("/api/auth/login/json", json={"email": "admin@marketbytes.com", "password": "MarketBytesAdmin2026!"})
print(f"Login: {r.status_code}")
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

r = client.get("/api/leads", headers=headers)
print(f"Leads API: {r.status_code}")
data = r.json()
print(f"Total leads: {data.get('total', 0)}")
for lead in data.get("items", [])[:3]:
    print(f"  {lead['contact_name']} | {lead['status']} | Org: {lead['organization_id'][:8]}...")

print("\n=== All checks complete ===")
