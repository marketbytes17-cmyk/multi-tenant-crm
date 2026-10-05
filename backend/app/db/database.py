import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./multi_tenant_crm.db")

try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Test connection DBAPI import
        engine.connect().close()
except Exception as err:
    print(f"[Database Notice] Could not connect to PostgreSQL ({str(err)}). Falling back to SQLite for local development...")
    DATABASE_URL = "sqlite:///./multi_tenant_crm.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_tenant_db(tenant_id: str | None = None, is_super_admin: bool = False):
    """
    FastAPI Database Dependency for Multi-Tenant Isolation.
    Sets PostgreSQL session settings `app.current_tenant_id` and `app.is_super_admin`
    using `SET LOCAL` scoped strictly to the current transaction block.
    """
    from sqlalchemy import text

    db = SessionLocal()
    try:
        if not DATABASE_URL.startswith("sqlite"):
            # Set transaction-scoped RLS session variables in PostgreSQL
            tenant_val = str(tenant_id) if tenant_id else ""
            admin_val = "true" if is_super_admin else "false"

            db.execute(text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"), {"tenant_id": tenant_val})
            db.execute(text("SELECT set_config('app.is_super_admin', :is_super_admin, true)"), {"is_super_admin": admin_val})
        yield db
    finally:
        db.close()

