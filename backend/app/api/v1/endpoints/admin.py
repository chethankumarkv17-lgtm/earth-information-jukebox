"""
NASA Earth Information Jukebox — Administrative API Endpoints
2026 NASA Space Apps Challenge

Strictly enforces:
- Administrator role verification on the backend via require_admin dependency.
- Administrative management of accounts, roles, and platform statistics.
"""

import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status

from app.core.auth_deps import require_admin
from app.db.database import get_db_connection
from app.schemas.auth import UserProfileResponse, UserRoleUpdateRequest
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Administrative Controls"])


@router.get("/users")
async def list_all_users(admin_user: dict = Depends(require_admin)):
    """
    Administrator only:
    List all registered users across the platform with roles, verification state,
    and count of saved explorations.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.id, u.email, u.full_name, u.role, u.is_verified, u.avatar_url, u.bio,
           u.created_at, u.updated_at,
           COUNT(e.id) as saved_explorations_count
    FROM users u
    LEFT JOIN saved_explorations e ON u.id = e.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    users = [dict(r) for r in rows]
    return {
        "status": "success",
        "total_users": len(users),
        "users": users
    }


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Administrator only:
    Promotes or demotes a user's role ('registered' <-> 'admin').
    Prevents self-demotion to avoid locking out the last admin.
    """
    if user_id == admin_user["id"] and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot demote their own account to prevent lockouts."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")

    cursor.execute("UPDATE users SET role = ? WHERE id = ?", (payload.role, user_id))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": f"User '{user_id}' role updated to '{payload.role}'."
    }


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Administrator only:
    Moderation deletion of a user account and associated explorations.
    Prevents self-deletion via admin endpoint.
    """
    if user_id == admin_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account via administrative controls."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_explorations WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM user_preferences WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": f"User account '{user_id}' and all owned data were permanently removed by Administrator."
    }


@router.get("/system-stats")
async def get_system_stats(admin_user: dict = Depends(require_admin)):
    """
    Administrator only:
    Returns platform-wide security, storage, and user metrics.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()["total_users"]

    cursor.execute("SELECT COUNT(*) as total_admins FROM users WHERE role = 'admin'")
    total_admins = cursor.fetchone()["total_admins"]

    cursor.execute("SELECT COUNT(*) as total_explorations FROM saved_explorations")
    total_explorations = cursor.fetchone()["total_explorations"]

    cursor.execute("SELECT COUNT(*) as revoked_tokens FROM revoked_tokens")
    revoked_count = cursor.fetchone()["revoked_tokens"]

    db_size_bytes = os.path.getsize(settings.DB_PATH) if os.path.exists(settings.DB_PATH) else 0
    conn.close()

    return {
        "status": "success",
        "total_registered_users": total_users,
        "total_administrators": total_admins,
        "total_saved_explorations": total_explorations,
        "revoked_tokens_count": revoked_count,
        "database_size_bytes": db_size_bytes,
        "database_path": settings.DB_PATH,
        "auth_security_level": "NIST PBKDF2-HMAC-SHA256 (200k iterations) + Signed HS256 JWT",
        "jwt_expiry_hours": settings.ACCESS_TOKEN_EXPIRE_MINUTES / 60
    }
