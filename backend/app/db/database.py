"""
NASA Earth Information Jukebox — Embedded Database & Row-Level Access Layer
2026 NASA Space Apps Challenge

Provides SQLite schema initialization, connection management,
and row-level authorization queries for users, explorations, and preferences.
"""

import os
import sqlite3
import datetime
import secrets
import hashlib
from typing import Dict, Any, List, Optional
from app.config import settings

# Ensure db directory exists
os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)


def _seed_hash_password(password: str):
    """Local PBKDF2 hasher for seeding to prevent circular imports."""
    salt = secrets.token_hex(32)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000
    )
    return key.hex(), salt


def get_db_connection() -> sqlite3.Connection:
    """Creates a thread-safe connection with row factory enabling dict-like column access."""
    conn = sqlite3.connect(settings.DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initializes SQLite schema and creates seed administrator if not existing."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'registered', -- 'registered' | 'admin'
        is_verified INTEGER NOT NULL DEFAULT 0,
        verification_token TEXT,
        reset_token TEXT,
        reset_token_expires_at TEXT,
        avatar_url TEXT,
        bio TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # 2. Saved Earth Explorations Table (with foreign key to users)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_explorations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        mode TEXT DEFAULT 'explore', -- 'explore' | 'compare_location' | 'compare_dataset' | 'journey' | 'timemachine'
        location_id TEXT,
        dataset_id TEXT,
        comparison_location_id TEXT,
        comparison_dataset_id TEXT,
        coordinates_json TEXT, -- JSON string of lat/lon/zoom
        sonification_preset TEXT DEFAULT 'scientific_analytic',
        playback_speed REAL DEFAULT 1.0,
        date_selected TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 3. User Sonification Preferences Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        default_preset TEXT DEFAULT 'scientific_analytic',
        master_volume REAL DEFAULT 0.8,
        playback_speed REAL DEFAULT 1.0,
        high_contrast_default INTEGER DEFAULT 0,
        guided_mode_default INTEGER DEFAULT 0,
        audio_descriptions_enabled INTEGER DEFAULT 1,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 4. Revoked JWT Tokens Table (for instantaneous logout revocation)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        revoked_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )
    """)

    # Create indices for fast lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_saved_explorations_user ON saved_explorations(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON revoked_tokens(jti)")

    conn.commit()
    conn.close()

    # Seed default Admin and Explorer users if table is empty
    seed_initial_users()


def seed_initial_users():
    """Seeds default verified accounts for NASA Space Apps testing and evaluation in non-production environments."""
    if settings.ENVIRONMENT.lower() == "production":
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if admin exists
    cursor.execute("SELECT id FROM users WHERE email = 'admin@nasa.spaceapps.org'")
    if not cursor.fetchone():
        admin_pwd_hash, admin_salt = _seed_hash_password("NasaSpaceApps2026!")
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO users (id, email, hashed_password, salt, full_name, role, is_verified, avatar_url, bio, created_at, updated_at)
        VALUES ('usr_admin_001', 'admin@nasa.spaceapps.org', ?, ?, 'NASA Flight Director', 'admin', 1, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', 'Lead Administrator for NASA Space Apps Earth Information Jukebox.', ?, ?)
        """, (admin_pwd_hash, admin_salt, now_str, now_str))

        # Default admin preferences
        cursor.execute("""
        INSERT OR REPLACE INTO user_preferences (user_id, default_preset, master_volume, playback_speed, high_contrast_default, guided_mode_default, audio_descriptions_enabled, updated_at)
        VALUES ('usr_admin_001', 'scientific_analytic', 0.85, 1.0, 0, 0, 1, ?)
        """, (now_str,))

    # Check if demo explorer exists
    cursor.execute("SELECT id FROM users WHERE email = 'explorer@earthjukebox.org'")
    if not cursor.fetchone():
        exp_pwd_hash, exp_salt = _seed_hash_password("EarthJukebox2026!")
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO users (id, email, hashed_password, salt, full_name, role, is_verified, avatar_url, bio, created_at, updated_at)
        VALUES ('usr_demo_002', 'explorer@earthjukebox.org', ?, ?, 'Helena Vance', 'registered', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Earth System Science Researcher focusing on Amazon canopy phenology and Arctic sea ice thermodynamics.', ?, ?)
        """, (exp_pwd_hash, exp_salt, now_str, now_str))

        # Default explorer preferences
        cursor.execute("""
        INSERT OR REPLACE INTO user_preferences (user_id, default_preset, master_volume, playback_speed, high_contrast_default, guided_mode_default, audio_descriptions_enabled, updated_at)
        VALUES ('usr_demo_002', 'ambient_documentary', 0.80, 1.0, 0, 0, 1, ?)
        """, (now_str,))

        # Seed initial saved explorations for demo explorer
        cursor.execute("""
        INSERT INTO saved_explorations (id, user_id, title, description, mode, location_id, dataset_id, comparison_location_id, comparison_dataset_id, coordinates_json, sonification_preset, playback_speed, date_selected, notes, created_at, updated_at)
        VALUES ('exp_seed_001', 'usr_demo_002', 'Amazon Basin vs Sahara Thermodynamic Divergence', 'Direct physical comparison of tropical rainforest canopy vs hyper-arid desert temperatures.', 'compare_location', 'amazon_basin', 'temperature', 'sahara_desert', 'temperature', '{"lat": -3.46, "lon": -62.21}', 'binaural_spatial', 1.0, '2024-08-01', 'Strong anti-phase temperature diurnal coupling observed.', ?, ?)
        """, (now_str, now_str))

        cursor.execute("""
        INSERT INTO saved_explorations (id, user_id, title, description, mode, location_id, dataset_id, comparison_location_id, comparison_dataset_id, coordinates_json, sonification_preset, playback_speed, date_selected, notes, created_at, updated_at)
        VALUES ('exp_seed_002', 'usr_demo_002', 'Arctic Sea Ice Minimum Multidecadal Trend', 'Historical 1979-2024 NSIDC microwave altimetry ice pack loss.', 'timemachine', 'svalbard_arctic', 'arctic_sea_ice', NULL, NULL, '{"lat": 78.22, "lon": 15.62}', 'scientific_analytic', 1.5, '2024-09-15', 'Sub-bass transition audible across decade 2005-2015.', ?, ?)
        """, (now_str, now_str))

    conn.commit()
    conn.close()


# Initialize database schema on module load
init_db()
