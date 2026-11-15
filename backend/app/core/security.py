"""
NASA Earth Information Jukebox — Cryptographic Security & JWT Engine
2026 NASA Space Apps Challenge

Implements:
- NIST-compliant PBKDF2-HMAC-SHA256 password hashing with 200,000 iterations and cryptographic salting.
- Cryptographically signed JWT access tokens (HS256) with unique JTI identifiers.
- Revocation tracking preventing replay attacks after logout.
"""

import os
import secrets
import hashlib
import hmac
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any

import jwt
from app.config import settings
from app.db.database import get_db_connection

# NIST Recommended parameters for PBKDF2
PBKDF2_ITERATIONS = 200_000
HASH_ALGORITHM = "sha256"


def hash_password(password: str) -> Tuple[str, str]:
    """
    Hashes a plaintext password using PBKDF2-HMAC-SHA256 with a unique 32-byte salt.
    Returns (hashed_hex, salt_hex). Plaintext is never stored.
    """
    salt = secrets.token_hex(32)
    key = hashlib.pbkdf2_hmac(
        HASH_ALGORITHM,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS
    )
    return key.hex(), salt


def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """
    Verifies a plaintext password against the stored hash and salt.
    Uses hmac.compare_digest for constant-time comparison (prevents timing attacks).
    """
    key = hashlib.pbkdf2_hmac(
        HASH_ALGORITHM,
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS
    )
    return hmac.compare_digest(key.hex(), hashed_password)


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    full_name: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """
    Generates a cryptographically signed JWT access token.
    Returns (token_string, jti_id, expires_at_datetime).
    """
    jti = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "name": full_name or "",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }

    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expire


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT access token:
    1. Verifies cryptographic signature using JWT_SECRET.
    2. Validates expiration claim.
    3. Verifies that the token has not been revoked in the revocation registry.
    Raises jwt.PyJWTError or ValueError on validation failure.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM]
    )

    # Check revocation status
    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise ValueError("Token has been revoked upon logout.")

    return payload


def revoke_token(jti: str, expires_at: datetime):
    """Adds a token's JTI to the revocation table until its natural expiration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    exp_str = expires_at.isoformat() if isinstance(expires_at, datetime) else str(expires_at)
    cursor.execute(
        "INSERT OR REPLACE INTO revoked_tokens (jti, revoked_at, expires_at) VALUES (?, ?, ?)",
        (jti, now_str, exp_str)
    )
    conn.commit()
    conn.close()


def is_token_revoked(jti: str) -> bool:
    """Checks whether a token JTI exists in the revoked tokens registry."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT jti FROM revoked_tokens WHERE jti = ?", (jti,))
    row = cursor.fetchone()
    conn.close()
    return row is not None


def generate_secure_token() -> str:
    """Generates a high-entropy URL-safe hex token for email verification and password resets."""
    return secrets.token_urlsafe(32)
