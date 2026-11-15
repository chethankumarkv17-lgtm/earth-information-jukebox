"""
NASA Earth Information Jukebox — User Profile, Saved Explorations & Preferences
2026 NASA Space Apps Challenge

Enforces:
- Row-Level Security: Users can only view, update, and delete their own saved records.
- Cascading deletion of user records upon account deletion.
"""

import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status

from app.core.auth_deps import get_current_user, enforce_record_ownership
from app.db.database import get_db_connection
from app.schemas.auth import (
    UserProfileResponse,
    UserProfileUpdateRequest,
    SavedExplorationCreateRequest,
    SavedExplorationUpdateRequest,
    SavedExplorationResponse,
    SavedExplorationListResponse,
    UserPreferencesRequest,
    UserPreferencesResponse,
)

router = APIRouter(prefix="/user", tags=["User Profile & Personal Data"])


# =============================================================================
# 1. User Profile Management
# =============================================================================
@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Fetch current user profile."""
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


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    payload: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update profile fields (full name, avatar URL, bio)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    new_name = payload.full_name if payload.full_name is not None else current_user["full_name"]
    new_avatar = payload.avatar_url if payload.avatar_url is not None else current_user["avatar_url"]
    new_bio = payload.bio if payload.bio is not None else current_user["bio"]

    cursor.execute("""
    UPDATE users SET full_name = ?, avatar_url = ?, bio = ?, updated_at = ? WHERE id = ?
    """, (new_name, new_avatar, new_bio, now_str, current_user["id"]))
    conn.commit()
    conn.close()

    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=new_name,
        role=current_user["role"],
        is_verified=bool(current_user["is_verified"]),
        avatar_url=new_avatar,
        bio=new_bio,
        created_at=current_user["created_at"],
        updated_at=now_str
    )


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Self-service account deletion:
    Permanently deletes user profile, saved explorations, and preferences.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Cascade delete is configured via foreign keys in SQLite
    cursor.execute("DELETE FROM saved_explorations WHERE user_id = ?", (current_user["id"],))
    cursor.execute("DELETE FROM user_preferences WHERE user_id = ?", (current_user["id"],))
    cursor.execute("DELETE FROM users WHERE id = ?", (current_user["id"],))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "User account and all associated explorations were permanently deleted."
    }


# =============================================================================
# 2. Saved Earth Explorations (Row-Level Authorization)
# =============================================================================
@router.get("/explorations", response_model=SavedExplorationListResponse)
async def list_saved_explorations(current_user: dict = Depends(get_current_user)):
    """List all explorations saved by the authenticated user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, title, description, mode, location_id, dataset_id,
           comparison_location_id, comparison_dataset_id, coordinates_json,
           sonification_preset, playback_speed, date_selected, notes, created_at, updated_at
    FROM saved_explorations
    WHERE user_id = ?
    ORDER BY created_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    explorations = [SavedExplorationResponse(**dict(r)) for r in rows]
    return SavedExplorationListResponse(total_saved=len(explorations), explorations=explorations)


@router.post("/explorations", response_model=SavedExplorationResponse, status_code=status.HTTP_201_CREATED)
async def create_saved_exploration(
    payload: SavedExplorationCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save an Earth exploration bookmark with current view, layer, and sonification parameters."""
    exp_id = f"exp_{uuid.uuid4().hex[:12]}"
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO saved_explorations (
        id, user_id, title, description, mode, location_id, dataset_id,
        comparison_location_id, comparison_dataset_id, coordinates_json,
        sonification_preset, playback_speed, date_selected, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        exp_id, current_user["id"], payload.title, payload.description,
        payload.mode or "explore", payload.location_id, payload.dataset_id,
        payload.comparison_location_id, payload.comparison_dataset_id,
        payload.coordinates_json, payload.sonification_preset or "scientific_analytic",
        payload.playback_speed or 1.0, payload.date_selected, payload.notes,
        now_str, now_str
    ))
    conn.commit()
    conn.close()

    return SavedExplorationResponse(
        id=exp_id,
        user_id=current_user["id"],
        title=payload.title,
        description=payload.description,
        mode=payload.mode or "explore",
        location_id=payload.location_id,
        dataset_id=payload.dataset_id,
        comparison_location_id=payload.comparison_location_id,
        comparison_dataset_id=payload.comparison_dataset_id,
        coordinates_json=payload.coordinates_json,
        sonification_preset=payload.sonification_preset or "scientific_analytic",
        playback_speed=payload.playback_speed or 1.0,
        date_selected=payload.date_selected,
        notes=payload.notes,
        created_at=now_str,
        updated_at=now_str
    )


@router.get("/explorations/{exp_id}", response_model=SavedExplorationResponse)
async def get_saved_exploration(
    exp_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve a single saved exploration. Strictly enforces ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, title, description, mode, location_id, dataset_id,
           comparison_location_id, comparison_dataset_id, coordinates_json,
           sonification_preset, playback_speed, date_selected, notes, created_at, updated_at
    FROM saved_explorations WHERE id = ?
    """, (exp_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Saved exploration not found.")

    record = dict(row)
    enforce_record_ownership(record["user_id"], current_user)
    return SavedExplorationResponse(**record)


@router.put("/explorations/{exp_id}", response_model=SavedExplorationResponse)
async def update_saved_exploration(
    exp_id: str,
    payload: SavedExplorationUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a saved exploration. Strictly enforces ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_explorations WHERE id = ?", (exp_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Saved exploration not found.")

    record = dict(row)
    enforce_record_ownership(record["user_id"], current_user)

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    title = payload.title if payload.title is not None else record["title"]
    description = payload.description if payload.description is not None else record["description"]
    mode = payload.mode if payload.mode is not None else record["mode"]
    location_id = payload.location_id if payload.location_id is not None else record["location_id"]
    dataset_id = payload.dataset_id if payload.dataset_id is not None else record["dataset_id"]
    comp_loc = payload.comparison_location_id if payload.comparison_location_id is not None else record["comparison_location_id"]
    comp_ds = payload.comparison_dataset_id if payload.comparison_dataset_id is not None else record["comparison_dataset_id"]
    coords = payload.coordinates_json if payload.coordinates_json is not None else record["coordinates_json"]
    preset = payload.sonification_preset if payload.sonification_preset is not None else record["sonification_preset"]
    speed = payload.playback_speed if payload.playback_speed is not None else record["playback_speed"]
    date_sel = payload.date_selected if payload.date_selected is not None else record["date_selected"]
    notes = payload.notes if payload.notes is not None else record["notes"]

    cursor.execute("""
    UPDATE saved_explorations SET
        title = ?, description = ?, mode = ?, location_id = ?, dataset_id = ?,
        comparison_location_id = ?, comparison_dataset_id = ?, coordinates_json = ?,
        sonification_preset = ?, playback_speed = ?, date_selected = ?, notes = ?, updated_at = ?
    WHERE id = ?
    """, (title, description, mode, location_id, dataset_id, comp_loc, comp_ds, coords, preset, speed, date_sel, notes, now_str, exp_id))
    conn.commit()
    conn.close()

    return SavedExplorationResponse(
        id=exp_id,
        user_id=record["user_id"],
        title=title,
        description=description,
        mode=mode,
        location_id=location_id,
        dataset_id=dataset_id,
        comparison_location_id=comp_loc,
        comparison_dataset_id=comp_ds,
        coordinates_json=coords,
        sonification_preset=preset,
        playback_speed=speed,
        date_selected=date_sel,
        notes=notes,
        created_at=record["created_at"],
        updated_at=now_str
    )


@router.delete("/explorations/{exp_id}")
async def delete_saved_exploration(
    exp_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved exploration. Strictly enforces ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id FROM saved_explorations WHERE id = ?", (exp_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Saved exploration not found.")

    record = dict(row)
    enforce_record_ownership(record["user_id"], current_user)

    cursor.execute("DELETE FROM saved_explorations WHERE id = ?", (exp_id,))
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Exploration '{exp_id}' deleted successfully."}


# =============================================================================
# 3. User Sonification Preferences
# =============================================================================
@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Fetch user's customized sonification and accessibility defaults."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT user_id, default_preset, master_volume, playback_speed,
           high_contrast_default, guided_mode_default, audio_descriptions_enabled, updated_at
    FROM user_preferences WHERE user_id = ?
    """, (current_user["id"],))
    row = cursor.fetchone()
    conn.close()

    if not row:
        # Create default preferences record if missing
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return UserPreferencesResponse(
            user_id=current_user["id"],
            default_preset="scientific_analytic",
            master_volume=0.8,
            playback_speed=1.0,
            high_contrast_default=False,
            guided_mode_default=False,
            audio_descriptions_enabled=True,
            updated_at=now_str
        )

    r = dict(row)
    return UserPreferencesResponse(
        user_id=r["user_id"],
        default_preset=r["default_preset"],
        master_volume=float(r["master_volume"]),
        playback_speed=float(r["playback_speed"]),
        high_contrast_default=bool(r["high_contrast_default"]),
        guided_mode_default=bool(r["guided_mode_default"]),
        audio_descriptions_enabled=bool(r["audio_descriptions_enabled"]),
        updated_at=r["updated_at"]
    )


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    payload: UserPreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save user's customized sonification and accessibility defaults."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO user_preferences (
        user_id, default_preset, master_volume, playback_speed,
        high_contrast_default, guided_mode_default, audio_descriptions_enabled, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
        default_preset = excluded.default_preset,
        master_volume = excluded.master_volume,
        playback_speed = excluded.playback_speed,
        high_contrast_default = excluded.high_contrast_default,
        guided_mode_default = excluded.guided_mode_default,
        audio_descriptions_enabled = excluded.audio_descriptions_enabled,
        updated_at = excluded.updated_at
    """, (
        current_user["id"],
        payload.default_preset or "scientific_analytic",
        payload.master_volume if payload.master_volume is not None else 0.8,
        payload.playback_speed if payload.playback_speed is not None else 1.0,
        1 if payload.high_contrast_default else 0,
        1 if payload.guided_mode_default else 0,
        1 if payload.audio_descriptions_enabled else 0,
        now_str
    ))
    conn.commit()
    conn.close()

    return UserPreferencesResponse(
        user_id=current_user["id"],
        default_preset=payload.default_preset or "scientific_analytic",
        master_volume=payload.master_volume if payload.master_volume is not None else 0.8,
        playback_speed=payload.playback_speed if payload.playback_speed is not None else 1.0,
        high_contrast_default=bool(payload.high_contrast_default),
        guided_mode_default=bool(payload.guided_mode_default),
        audio_descriptions_enabled=bool(payload.audio_descriptions_enabled),
        updated_at=now_str
    )
