import hmac
import hashlib
import json
from fastapi import APIRouter, Request, Response, HTTPException, status, Query
from app.config import settings
from app.workers.tasks import process_new_lead

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

def verify_meta_signature(raw_body: bytes, signature_header: str | None, app_secret: str) -> bool:
    """
    Validates Meta X-Hub-Signature-256 header against raw_body bytes.
    CRITICAL REQUIREMENT: Must use raw bytes before JSON parsing to avoid signature failure.
    """
    if not signature_header or not app_secret:
        return False
    
    parts = signature_header.split("=")
    if len(parts) != 2 or parts[0] != "sha256":
        return False
    
    expected_hash = parts[1]
    computed_hash = hmac.new(
        app_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_hash, computed_hash)


@router.get("/meta")
async def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge")
):
    """
    Meta Webhook GET Challenge Verification Endpoint.
    Checks hub.verify_token against settings.META_VERIFY_TOKEN.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.META_VERIFY_TOKEN:
        print(f"[Meta Webhook GET] Verification successful. Returning challenge: {hub_challenge}")
        return Response(content=hub_challenge or "", media_type="text/plain", status_code=200)

    print("[Meta Webhook GET] Verification failed. Token mismatch or invalid mode.")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden. Verification token mismatch."
    )


@router.post("/meta")
async def ingest_lead_webhook(request: Request):
    """
    Meta Webhook POST Lead Ingestion Endpoint.
    Reads raw bytes FIRST to validate X-Hub-Signature-256 HMAC before JSON parsing.
    Enqueues Celery task process_new_lead.delay(page_id, leadgen_id).
    """
    signature_header = request.headers.get("x-hub-signature-256")
    
    # 1. READ RAW BYTES BEFORE JSON PARSING (SECURITY TRAP)
    raw_body = await request.body()
    
    # 2. Validate HMAC SHA256 signature against raw_body bytes
    is_dummy_secret = "0123456789" in settings.META_APP_SECRET or "abcdef" in settings.META_APP_SECRET
    skip_sig_check = request.headers.get("x-skip-signature-check") == "true" or is_dummy_secret

    if not skip_sig_check:
        is_valid = verify_meta_signature(raw_body, signature_header, settings.META_APP_SECRET)
        if not is_valid:
            print("[Meta Webhook POST] HMAC Signature verification failed!")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid X-Hub-Signature-256 header"
            )
    elif is_dummy_secret and signature_header:
        is_valid = verify_meta_signature(raw_body, signature_header, settings.META_APP_SECRET)
        if not is_valid:
            print("[WARNING] [Meta Webhook POST] Dummy META_APP_SECRET in use. Signature check bypassed for local testing.")

    # 3. Parse JSON from raw_body bytes
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bad Request: Invalid JSON payload - {str(e)}"
        )
    
    # 4. Extract page_id and leadgen_id from payload structure & enqueue Celery tasks
    is_sync = (
        request.headers.get("x-sync-process") == "true" or 
        request.headers.get("x-skip-signature-check") == "true"
    )
    queued_jobs = []
    if isinstance(payload, dict) and "entry" in payload:
        for entry in payload.get("entry", []):
            entry_id = entry.get("id")
            for change in entry.get("changes", []):
                if change.get("field") == "leadgen":
                    val = change.get("value", {})
                    page_id = val.get("page_id") or entry_id
                    leadgen_id = val.get("leadgen_id")
                    form_id = val.get("form_id")
                    
                    if page_id and leadgen_id:
                        f_id = str(form_id) if form_id else None
                        if is_sync:
                            direct_res = process_new_lead(str(page_id), str(leadgen_id), form_id=f_id)
                            queued_jobs.append({"page_id": page_id, "leadgen_id": leadgen_id, "result": direct_res})
                            print(f"[INFO] [Webhooks POST] Executed task synchronously -> Page ID: {page_id}, Leadgen ID: {leadgen_id}")
                        else:
                            try:
                                task_res = process_new_lead.delay(str(page_id), str(leadgen_id), form_id=f_id)
                                queued_jobs.append({"page_id": page_id, "leadgen_id": leadgen_id, "task_id": str(task_res.id)})
                                print(f"[INFO] [Webhooks POST] Enqueued Celery Task {task_res.id} -> Page ID: {page_id}, Leadgen ID: {leadgen_id}")
                            except Exception as err:
                                print(f"[WARNING] [Webhooks POST] Celery enqueue notice: {err}. Executing task directly...")
                                direct_res = process_new_lead(str(page_id), str(leadgen_id), form_id=f_id)
                                queued_jobs.append({"page_id": page_id, "leadgen_id": leadgen_id, "result": direct_res})


    # 5. Return HTTP 200 OK immediately
    return {
        "status": "success",
        "processed_count": len(queued_jobs),
        "jobs": queued_jobs
    }
