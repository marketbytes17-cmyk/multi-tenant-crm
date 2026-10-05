import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from app.config import settings

SECRET_KEY = getattr(settings, "JWT_SECRET", os.getenv("JWT_SECRET", "super_secret_jwt_key_market_bytes_2026"))
ALGORITHM = getattr(settings, "JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours default token lifetime

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against bcrypt hashed password."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(
    subject: str,
    organization_id: str | None = None,
    role: str = "SALES_REP",
    expires_delta: timedelta | None = None
) -> str:
    """Creates a signed JWT access token containing subject identity."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decodes and validates a JWT token. Raises PyJWT exceptions if expired/invalid."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
