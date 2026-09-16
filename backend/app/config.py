import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Multi-Tenant Agency CRM Backend")
    META_VERIFY_TOKEN: str = os.getenv("META_VERIFY_TOKEN", "meta_crm_verify_token_secure_123")
    META_APP_SECRET: str = os.getenv("META_APP_SECRET", "0123456789abcdef0123456789abcdef")
    MASTER_SYSTEM_USER_ACCESS_TOKEN: str = os.getenv("MASTER_SYSTEM_USER_ACCESS_TOKEN", "EAAG_DEMO_MASTER_SYSTEM_USER_TOKEN_SECURE")
    META_GRAPH_API_VERSION: str = os.getenv("META_GRAPH_API_VERSION", "v20.0")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@127.0.0.1:5432/agency_crm")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "agency_crm_fastapi_jwt_secret_key_2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

settings = Settings()
