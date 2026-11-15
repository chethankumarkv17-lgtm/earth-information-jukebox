"""
NASA Earth Information Jukebox — Pydantic Schemas for Authentication & User Data
2026 NASA Space Apps Challenge
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# Auth Requests & Responses
# =============================================================================
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: Optional[str] = Field(None, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(..., min_length=8)


class EmailVerifyRequest(BaseModel):
    email: EmailStr
    token: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str # 'guest' | 'registered' | 'admin'
    is_verified: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: str
    updated_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserProfileResponse


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=500)


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(registered|admin)$")


# =============================================================================
# Saved Explorations
# =============================================================================
class SavedExplorationCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    mode: Optional[str] = "explore"
    location_id: Optional[str] = None
    dataset_id: Optional[str] = None
    comparison_location_id: Optional[str] = None
    comparison_dataset_id: Optional[str] = None
    coordinates_json: Optional[str] = None
    sonification_preset: Optional[str] = "scientific_analytic"
    playback_speed: Optional[float] = 1.0
    date_selected: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)


class SavedExplorationUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    mode: Optional[str] = None
    location_id: Optional[str] = None
    dataset_id: Optional[str] = None
    comparison_location_id: Optional[str] = None
    comparison_dataset_id: Optional[str] = None
    coordinates_json: Optional[str] = None
    sonification_preset: Optional[str] = None
    playback_speed: Optional[float] = None
    date_selected: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)


class SavedExplorationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    mode: str
    location_id: Optional[str] = None
    dataset_id: Optional[str] = None
    comparison_location_id: Optional[str] = None
    comparison_dataset_id: Optional[str] = None
    coordinates_json: Optional[str] = None
    sonification_preset: str
    playback_speed: float
    date_selected: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class SavedExplorationListResponse(BaseModel):
    total_saved: int
    explorations: List[SavedExplorationResponse]


# =============================================================================
# User Preferences
# =============================================================================
class UserPreferencesRequest(BaseModel):
    default_preset: Optional[str] = "scientific_analytic"
    master_volume: Optional[float] = Field(0.8, ge=0.0, le=1.0)
    playback_speed: Optional[float] = Field(1.0, ge=0.25, le=2.0)
    high_contrast_default: Optional[bool] = False
    guided_mode_default: Optional[bool] = False
    audio_descriptions_enabled: Optional[bool] = True


class UserPreferencesResponse(BaseModel):
    user_id: str
    default_preset: str
    master_volume: float
    playback_speed: float
    high_contrast_default: bool
    guided_mode_default: bool
    audio_descriptions_enabled: bool
    updated_at: str
