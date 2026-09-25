import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv()

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import Base, engine, SessionLocal
from app.models.models import Organization, PageMapping, Lead, UnmappedLead
from app.workers.celery_app import celery_app
from app.workers.tasks import process_new_lead, reprocess_unmapped_leads

# Enable Celery Eager Mode for testing without a live Redis server
celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
)


def test_lead_routing_worker():

    print("=" * 70)
    print("      Lead Routing Worker & Dead-Letter Queue Test Suite")
    print("=" * 70)

    # Reset DB state
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Seed Tenant Organization & Page Mapping
    org_id = str(uuid.uuid4())
    org = Organization(id=org_id, name="Worker Test Client Agency")
    db.add(org)

    mapped_page_id = "page_mapped_998877"
    mapping = PageMapping(organization_id=org_id, page_id=mapped_page_id, page_name="Test Official FB Page")
    db.add(mapping)
    db.commit()

    # 1. Test Successful Ingestion for Mapped Page ID
    leadgen_id_1 = f"leadgen_{uuid.uuid4().hex[:8]}"
    res1 = process_new_lead(page_id=mapped_page_id, leadgen_id=leadgen_id_1)
    assert res1["status"] == "success", f"Expected success, got {res1}"
    assert res1["organization_id"] == org_id
    print("[OK] Successful Lead Routing & Tenant Association passed.")

    # 2. Test Idempotent Deduplication for Duplicate leadgen_id
    res2 = process_new_lead(page_id=mapped_page_id, leadgen_id=leadgen_id_1)
    assert res2["status"] == "duplicate", f"Expected duplicate status, got {res2}"
    print("[OK] Idempotent Lead Deduplication passed.")

    # 3. Test Dead-Letter Queue Holding for Unmapped Page ID
    unmapped_page_id = "page_unmapped_112233"
    leadgen_id_2 = f"leadgen_{uuid.uuid4().hex[:8]}"
    res3 = process_new_lead(page_id=unmapped_page_id, leadgen_id=leadgen_id_2)
    assert res3["status"] == "held_in_dead_letter_queue", f"Expected dead-letter holding, got {res3}"
    print("[OK] Dead-Letter Queue Holding (unmapped_leads) passed.")

    # Verify dead-letter table entry
    dead_letter_item = db.query(UnmappedLead).filter(UnmappedLead.leadgen_id == leadgen_id_2).first()
    assert dead_letter_item is not None
    assert dead_letter_item.status == "UNMAPPED"
    assert dead_letter_item.page_id == unmapped_page_id
    print("[OK] Dead-Letter DB record verification passed.")

    # 4. Provision Page Mapping for Unmapped Page & Reprocess
    new_mapping = PageMapping(organization_id=org_id, page_id=unmapped_page_id, page_name="Newly Connected Page")
    db.add(new_mapping)
    db.commit()

    # Run reprocess_unmapped_leads worker task
    reprocess_res = reprocess_unmapped_leads()
    assert reprocess_res["status"] == "success"
    assert reprocess_res["reprocessed_count"] == 1
    print("[OK] Dead-Letter Lead Re-processing passed.")

    db.close()

    print("\n" + "=" * 70)
    print("SUCCESS: ALL LEAD ROUTING WORKER & DEAD-LETTER QUEUE TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    test_lead_routing_worker()
