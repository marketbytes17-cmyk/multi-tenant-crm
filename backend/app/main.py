from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.webhooks import router as webhooks_router

app = FastAPI(
    title="Multi-Tenant Agency CRM Backend",
    version="1.0.0",
    description="FastAPI Backend for Multi-Tenant Meta Lead Ads CRM"
)

# CORS Middleware allowing requests from Next.js frontend on http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Webhook Router under /api prefix (/api/webhooks/meta)
app.include_router(webhooks_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Multi-Tenant Agency CRM API",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
