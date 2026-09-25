from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.webhooks import router as webhooks_router
from app.api.auth import router as auth_router
from app.api.leads import router as leads_router
from app.api.organizations import router as organizations_router
from app.api.page_mappings import router as page_mappings_router
from app.api.admin import router as admin_router, superadmin_router
from app.api.client_dashboards import client_router, rep_router, team_router

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

# Include API Routers under /api prefix
app.include_router(webhooks_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(organizations_router, prefix="/api")
app.include_router(page_mappings_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(superadmin_router, prefix="/api")
app.include_router(client_router, prefix="/api")
app.include_router(rep_router, prefix="/api")
app.include_router(team_router, prefix="/api")





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
