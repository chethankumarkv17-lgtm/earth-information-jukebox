"""
NASA Earth Information Jukebox — Authentication API Endpoints
2026 NASA Space Apps Challenge

Implements:
- Registration with password complexity validation
- Cryptographically verified login returning signed JWT
- Revocation-backed logout
- Email verification flow
- Password reset token flow
- Profile introspection (/me)
"""

import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    revoke_token,
    decode_access_token,
    generate_secure_token,
)
from app.core.auth_deps import get_current_user, bearer_scheme
from app.db.database import get_db_connection
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserProfileResponse,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    EmailVerifyRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Session Management"])


# =============================================================================
# 1. User Registration
# =============================================================================
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegisterRequest):
    """
    Registers a new Earth Explorer user account:
    - Validates email and password length (>= 8 chars).
    - Hashes password using NIST-compliant PBKDF2-HMAC-SHA256 with unique 32-byte salt.
    - Default role is 'registered' (Guest is anonymous unauthenticated).
    - Generates email verification token.
    - Returns immediate authenticated session JWT.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = payload.email.lower().strip()

    # Check for existing account
    cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    pwd_hash, salt = hash_password(payload.password)
    verify_token = generate_secure_token()
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO users (id, email, hashed_password, salt, full_name, role, is_verified, verification_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'registered', 0, ?, ?, ?)
    """, (user_id, email_clean, pwd_hash, salt, payload.full_name or "", verify_token, now_str, now_str))

    # Initialize default preferences
    cursor.execute("""
    INSERT INTO user_preferences (user_id, default_preset, master_volume, playback_speed, high_contrast_default, guided_mode_default, audio_descriptions_enabled, updated_at)
    VALUES (?, 'scientific_analytic', 0.8, 1.0, 0, 0, 1, ?)
    """, (user_id, now_str))

    conn.commit()
    conn.close()

    # Generate JWT
    token_str, jti, expire_dt = create_access_token(
        user_id=user_id,
        email=email_clean,
        role="registered",
        full_name=payload.full_name
    )

    user_profile = UserProfileResponse(
        id=user_id,
        email=email_clean,
        full_name=payload.full_name,
        role="registered",
        is_verified=False,
        avatar_url=None,
        bio=None,
        created_at=now_str,
        updated_at=now_str
    )

    return TokenResponse(
        access_token=token_str,
        token_type="bearer",
        expires_in_seconds=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60),
        user=user_profile
    )


# =============================================================================
# 2. User Login
# =============================================================================
@router.post("/login", response_model=TokenResponse)
async def login_user(payload: UserLoginRequest):
    """
    Authenticates a user via email and password:
    - Verifies PBKDF2 hash using constant-time comparison to prevent timing attacks.
    - Generates signed JWT access token containing role claim.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = payload.email.lower().strip()
    cursor.execute("""
    SELECT id, email, hashed_password, salt, full_name, role, is_verified, avatar_url, bio, created_at, updated_at
    FROM users WHERE email = ?
    """, (email_clean,))
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(payload.password, row["hashed_password"], row["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = row["id"]
    role = row["role"]
    full_name = row["full_name"]

    token_str, jti, expire_dt = create_access_token(
        user_id=user_id,
        email=email_clean,
        role=role,
        full_name=full_name
    )

    user_profile = UserProfileResponse(
        id=user_id,
        email=email_clean,
        full_name=full_name,
        role=role,
        is_verified=bool(row["is_verified"]),
        avatar_url=row["avatar_url"],
        bio=row["bio"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

    return TokenResponse(
        access_token=token_str,
        token_type="bearer",
        expires_in_seconds=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60),
        user=user_profile
    )


# =============================================================================
# 3. User Logout & Session Revocation
# =============================================================================
@router.post("/logout")
async def logout_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """
    Terminates the session and revokes the active token JTI in the revocation registry.
    Prevents token replay attacks even if the client retains the token.
    """
    if credentials and credentials.credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            jti = payload.get("jti")
            exp_ts = payload.get("exp")
            if jti and exp_ts:
                exp_dt = datetime.datetime.fromtimestamp(exp_ts, tz=datetime.timezone.utc)
                revoke_token(jti, exp_dt)
        except Exception:
            pass # Even if token was invalid or expired, proceed with successful logout acknowledgment

    return {"status": "success", "message": "Successfully logged out. Session revoked."}


# =============================================================================
# 4. Profile Introspection (/me)
# =============================================================================
@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's current verified profile and authoritative role.
    """
    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_verified=bool(current_user["is_verified"]),
        avatar_url=current_user["avatar_url"],
        bio=current_user["bio"],
        created_at=current_user["created_at"],
        updated_at=current_user["updated_at"]
    )


# =============================================================================
# 5. Email Verification
# =============================================================================
@router.post("/verify-email")
async def verify_user_email(payload: EmailVerifyRequest):
    """
    Confirms user email address using the secure verification token.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = payload.email.lower().strip()
    cursor.execute("SELECT id, verification_token FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()

    if not row or row["verification_token"] != payload.token:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute("""
    UPDATE users SET is_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?
    """, (now_str, row["id"]))
    conn.commit()
    conn.close()

    return {"status": "success", "message": "Email address verified successfully."}


# =============================================================================
# 6. Password Reset Flow
# =============================================================================
@router.post("/forgot-password")
async def request_password_reset(payload: PasswordResetRequest):
    """
    Generates a cryptographically random, time-bounded password reset token (1-hour expiry).
    Returns token directly in response for offline/hackathon demonstration.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = payload.email.lower().strip()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        # Return generic success response to prevent user enumeration
        return {
            "status": "success",
            "message": "If an account exists with this email, a password reset link has been dispatched."
        }

    reset_token = generate_secure_token()
    expire_dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute("""
    UPDATE users SET reset_token = ?, reset_token_expires_at = ?, updated_at = ? WHERE id = ?
    """, (reset_token, expire_dt.isoformat(), now_str, row["id"]))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "Password reset token generated successfully.",
        "demo_reset_token": reset_token # Exposed for demonstration / testing convenience
    }


@router.post("/reset-password")
async def confirm_password_reset(payload: PasswordResetConfirmRequest):
    """
    Verifies the reset token and updates the user's password with a new salt and PBKDF2 hash.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    email_clean = payload.email.lower().strip()
    cursor.execute("""
    SELECT id, reset_token, reset_token_expires_at FROM users WHERE email = ?
    """, (email_clean,))
    row = cursor.fetchone()

    if not row or not row["reset_token"] or row["reset_token"] != payload.token:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    # Check expiration
    if row["reset_token_expires_at"]:
        exp_dt = datetime.datetime.fromisoformat(row["reset_token_expires_at"])
        if datetime.datetime.now(datetime.timezone.utc) > exp_dt:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired. Please request a new password reset."
            )

    new_hash, new_salt = hash_password(payload.new_password)
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute("""
    UPDATE users SET hashed_password = ?, salt = ?, reset_token = NULL, reset_token_expires_at = NULL, updated_at = ?
    WHERE id = ?
    """, (new_hash, new_salt, now_str, row["id"]))
    conn.commit()
    conn.close()

    return {"status": "success", "message": "Password has been successfully updated. You may now log in with your new password."}
