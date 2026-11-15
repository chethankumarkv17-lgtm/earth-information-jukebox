"""
NASA Earth Information Jukebox — Comprehensive Backend Hardening Test Suite
2026 NASA Space Apps Challenge

Verifies:
1. Secure HTTP headers (OWASP recommendations)
2. API rate limiting (sliding window, 429 status, Retry-After)
3. Request size limits (413 Payload Too Large)
4. File processing security (magic bytes signature verification, path traversal prevention)
5. SSRF protection (loopback, private RFC 1918, cloud metadata 169.254.169.254, domain allowlist)
6. Access control and Row-Level Security (IDOR defense)
7. Admin route enforcement
8. Secure credential-sanitizing logging
9. Safe error responses
"""

import os
import sys
import io
import time
import uuid
import datetime
from starlette.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.config import settings
from app.core.rate_limiter import rate_limiter
from app.core.ssrf_protection import validate_external_url, SSRFSecurityError, is_ip_allowed
from app.core.safe_logging import CredentialSanitizingFilter
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db_connection


client = TestClient(app)

print("\n" + "=" * 65)
print("  RUNNING NASA EARTH JUKEBOX BACKEND HARDENING TEST SUITE")
print("=" * 65)


# =============================================================================
# [TEST GROUP 1] Secure HTTP Response Headers
# =============================================================================
print("\n[TEST GROUP 1] Secure HTTP Response Headers")

resp = client.get("/health")
assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
headers = resp.headers

assert headers.get("X-Content-Type-Options") == "nosniff", "Missing X-Content-Type-Options: nosniff"
print("  ✓ Passed: X-Content-Type-Options: nosniff verified")

assert headers.get("X-Frame-Options") == "DENY", "Missing X-Frame-Options: DENY"
print("  ✓ Passed: X-Frame-Options: DENY anti-clickjacking verified")

assert "max-age=" in headers.get("Strict-Transport-Security", ""), "Missing Strict-Transport-Security"
print("  ✓ Passed: Strict-Transport-Security verified")

assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin", "Missing Referrer-Policy"
print("  ✓ Passed: Referrer-Policy verified")

assert "camera=()" in headers.get("Permissions-Policy", ""), "Missing Permissions-Policy"
print("  ✓ Passed: Permissions-Policy hardware isolation verified")

assert "default-src 'self'" in headers.get("Content-Security-Policy", ""), "Missing Content-Security-Policy"
print("  ✓ Passed: Content-Security-Policy frame protection verified")

assert "server" not in headers, "Server fingerprint header was not stripped"
print("  ✓ Passed: Server fingerprinting header stripped")


# =============================================================================
# [TEST GROUP 2] API Rate Limiting (Sliding Window)
# =============================================================================
print("\n[TEST GROUP 2] API Rate Limiting")

rate_limiter.reset()

# Trigger sensitive auth rate limit (limit is 15 req/min)
auth_limited = False
for i in range(20):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@nasa.org", "password": "WrongPassword123!"}
    )
    if r.status_code == 429:
        auth_limited = True
        assert "Retry-After" in r.headers, "Missing Retry-After header on 429 response"
        assert r.headers.get("X-RateLimit-Remaining") == "0", "Expected X-RateLimit-Remaining: 0"
        data = r.json()
        assert data.get("code") == 429, "Expected error code 429 in JSON body"
        break

assert auth_limited, "Rate limiter failed to trigger 429 Too Many Requests on auth endpoint"
print("  ✓ Passed: Sensitive auth endpoint rate limit triggered with HTTP 429")
print("  ✓ Passed: Retry-After and X-RateLimit headers present in 429 response")

# Reset rate limiter after test
rate_limiter.reset()
print("  ✓ Passed: Rate limiter reset functional for test environment")


# =============================================================================
# [TEST GROUP 3] Request Size & Payload Ceiling Limits
# =============================================================================
print("\n[TEST GROUP 3] Request Size Limits")

# 1. Content-Length header exceeding JSON endpoint limit (1 MB)
oversized_json_headers = {"Content-Length": str(2 * 1024 * 1024), "Content-Type": "application/json"}
r_oversized = client.post(
    "/api/v1/auth/login",
    headers=oversized_json_headers,
    content=b'{"email": "test@nasa.org"}'
)
assert r_oversized.status_code == 413, f"Expected HTTP 413, got {r_oversized.status_code}"
assert r_oversized.json().get("code") == 413, "Expected code 413 in JSON response"
print("  ✓ Passed: Oversized JSON payload rejected with HTTP 413 Payload Too Large")

# 2. Content-Length header exceeding Upload endpoint limit (16 MB)
oversized_upload_headers = {"Content-Length": str(20 * 1024 * 1024), "Content-Type": "multipart/form-data"}
r_upload_oversized = client.post(
    "/api/v1/image/upload",
    headers=oversized_upload_headers,
    content=b'dummy data'
)
assert r_upload_oversized.status_code == 413, f"Expected HTTP 413, got {r_upload_oversized.status_code}"
print("  ✓ Passed: Oversized file upload rejected with HTTP 413 Payload Too Large")


# =============================================================================
# [TEST GROUP 4] File Processing Security & Magic Signatures
# =============================================================================
print("\n[TEST GROUP 4] File Processing Security & Magic Signatures")

# 1. Reject text file disguised as PNG
fake_png_bytes = b"This is just plain text disguised as an image."
fake_png_file = ("exploit.png", fake_png_bytes, "image/png")
r_fake_png = client.post("/api/v1/image/upload", files={"file": fake_png_file})
assert r_fake_png.status_code in (400, 415), f"Expected 400 or 415, got {r_fake_png.status_code}"
print(f"  ✓ Passed: Disguised file without PNG magic bytes rejected (HTTP {r_fake_png.status_code})")

# 2. Accept legitimate PNG bytes
from PIL import Image as PILImage
png_io = io.BytesIO()
PILImage.new("RGB", (16, 16), color=(0, 200, 255)).save(png_io, format="PNG")
valid_png_bytes = png_io.getvalue()
valid_png_file = ("valid_sample.png", valid_png_bytes, "image/png")
r_valid_png = client.post("/api/v1/image/upload", files={"file": valid_png_file})
assert r_valid_png.status_code == 200, f"Expected 200 for valid PNG, got {r_valid_png.status_code}: {r_valid_png.text}"
print("  ✓ Passed: Valid PNG with correct magic bytes accepted (HTTP 200)")

# 3. Scientific File Upload: Reject file with wrong header on GeoTIFF endpoint
fake_geotiff = ("sample.tif", b"Not a real GeoTIFF raster file", "image/tiff")
r_fake_tiff = client.post(
    "/api/earth/process/upload",
    files={"file": fake_geotiff},
    data={"domain": "vegetation"}
)
assert r_fake_tiff.status_code == 415, f"Expected 415 for invalid TIFF magic bytes, got {r_fake_tiff.status_code}"
print("  ✓ Passed: Disguised file without GeoTIFF magic bytes rejected (HTTP 415)")


# =============================================================================
# [TEST GROUP 5] Path Traversal Defenses
# =============================================================================
print("\n[TEST GROUP 5] Path Traversal Defenses")

# 1. Path traversal in delete image ID
r_traversal = client.delete("/api/v1/image/..%2F..%2Fetc%2Fpasswd")
assert r_traversal.status_code in (400, 404), f"Expected 400 or 404, got {r_traversal.status_code}"
print(f"  ✓ Passed: Path traversal sequence in image ID rejected (HTTP {r_traversal.status_code})")

# 2. Null byte injection in image ID
r_null_byte = client.delete("/api/v1/image/image123%00evil")
assert r_null_byte.status_code in (400, 404), f"Expected 400 or 404, got {r_null_byte.status_code}"
print(f"  ✓ Passed: Null byte injection in image ID rejected (HTTP {r_null_byte.status_code})")


# =============================================================================
# [TEST GROUP 6] SSRF Protection & URL Validation
# =============================================================================
print("\n[TEST GROUP 6] SSRF Protection & External URL Validation")

# 1. Test IP safety checker
assert not is_ip_allowed("127.0.0.1"), "Loopback 127.0.0.1 must be blocked"
assert not is_ip_allowed("10.0.0.1"), "RFC 1918 Class A must be blocked"
assert not is_ip_allowed("172.16.0.1"), "RFC 1918 Class B must be blocked"
assert not is_ip_allowed("192.168.1.1"), "RFC 1918 Class C must be blocked"
assert not is_ip_allowed("169.254.169.254"), "AWS metadata IP must be blocked"
assert not is_ip_allowed("::1"), "IPv6 loopback must be blocked"
print("  ✓ Passed: Private, loopback, and cloud metadata IPs blocked")

# 2. Test URL scheme and SSRF validator
def expect_ssrf_error(url_str, test_desc):
    threw = False
    try:
        validate_external_url(url_str)
    except SSRFSecurityError:
        threw = True
    assert threw, f"SSRFSecurityError was not raised for: {url_str}"
    print(f"  ✓ Passed: SSRF block: {test_desc}")

expect_ssrf_error("http://127.0.0.1:8000/api/admin", "Loopback URL rejected")
expect_ssrf_error("http://169.254.169.254/latest/meta-data/", "Cloud metadata service rejected")
expect_ssrf_error("file:///etc/passwd", "file:// scheme rejected")
expect_ssrf_error("https://malicious-exfiltration-server.com/steal", "Unapproved external domain rejected")

# Approved NASA domain allowed
safe_nasa = validate_external_url("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/test.jpg")
assert "gibs.earthdata.nasa.gov" in safe_nasa, "Failed to validate approved NASA domain"
print("  ✓ Passed: Approved NASA GIBS domain validated successfully")


# =============================================================================
# [TEST GROUP 7] Authentication & Token Authorization Security
# =============================================================================
print("\n[TEST GROUP 7] Authentication & Token Security")

rate_limiter.reset()

# 1. Access without token rejected
r_unauth = client.get("/api/v1/user/profile")
assert r_unauth.status_code == 401, f"Expected 401, got {r_unauth.status_code}"
print("  ✓ Passed: Missing Bearer token returns HTTP 401 Unauthorized")

# 2. Malformed token rejected
r_malformed = client.get(
    "/api/v1/user/profile",
    headers={"Authorization": "Bearer definitely-invalid-jwt-structure"}
)
assert r_malformed.status_code == 401, f"Expected 401, got {r_malformed.status_code}"
print("  ✓ Passed: Malformed Bearer token returns HTTP 401 Unauthorized")

# 3. Token signed with wrong secret rejected
import jwt
fake_token = jwt.encode(
    {
        "sub": "usr_fake",
        "email": "fake@nasa.org",
        "role": "registered",
        "jti": "fake-jti-uuid",
        "exp": int(time.time()) + 3600
    },
    "completely-wrong-unauthorized-key-secret",
    algorithm="HS256"
)
r_forged = client.get(
    "/api/v1/user/profile",
    headers={"Authorization": f"Bearer {fake_token}"}
)
assert r_forged.status_code == 401, f"Expected 401 for forged token, got {r_forged.status_code}"
print("  ✓ Passed: Forged signature token returns HTTP 401 Unauthorized")


# =============================================================================
# [TEST GROUP 8] Access Control & Row-Level Authorization (IDOR Defense)
# =============================================================================
print("\n[TEST GROUP 8] Row-Level Authorization (IDOR Defense)")

rate_limiter.reset()

# Login User A (Explorer Helena Vance)
r_login_a = client.post(
    "/api/v1/auth/login",
    json={"email": "explorer@earthjukebox.org", "password": "EarthJukebox2026!"}
)
assert r_login_a.status_code == 200, f"Login failed: {r_login_a.text}"
token_a = r_login_a.json()["access_token"]
headers_a = {"Authorization": f"Bearer {token_a}"}

# User A saves an exploration
r_save = client.post(
    "/api/v1/user/explorations",
    headers=headers_a,
    json={
        "title": "Private Equatorial Climate Transect",
        "mode": "explore",
        "dataset_id": "temperature"
    }
)
assert r_save.status_code == 201, f"Expected 201, got {r_save.status_code}"
exp_id = r_save.json()["id"]

# Register and login User B
user_b_email = f"user_b_{uuid.uuid4().hex[:8]}@earthjukebox.org"
r_reg_b = client.post(
    "/api/v1/auth/register",
    json={"email": user_b_email, "password": "SafePassword2026!", "full_name": "User B Explorer"}
)
assert r_reg_b.status_code == 201
token_b = r_reg_b.json()["access_token"]
headers_b = {"Authorization": f"Bearer {token_b}"}

# User B attempts to access User A's exploration (IDOR read attack)
r_idor_read = client.get(f"/api/v1/user/explorations/{exp_id}", headers=headers_b)
assert r_idor_read.status_code == 403, f"Expected 403 for IDOR read, got {r_idor_read.status_code}"
print("  ✓ Passed: RLS: User B cannot read User A's private exploration (HTTP 403)")

# User B attempts to update User A's exploration (IDOR update attack)
r_idor_update = client.put(
    f"/api/v1/user/explorations/{exp_id}",
    headers=headers_b,
    json={"title": "Hacked Title"}
)
assert r_idor_update.status_code == 403, f"Expected 403 for IDOR update, got {r_idor_update.status_code}"
print("  ✓ Passed: RLS: User B cannot modify User A's exploration (HTTP 403)")

# User B attempts to delete User A's exploration (IDOR delete attack)
r_idor_del = client.delete(f"/api/v1/user/explorations/{exp_id}", headers=headers_b)
assert r_idor_del.status_code == 403, f"Expected 403 for IDOR delete, got {r_idor_del.status_code}"
print("  ✓ Passed: RLS: User B cannot delete User A's exploration (HTTP 403)")


# =============================================================================
# [TEST GROUP 9] Administrative Role Protection
# =============================================================================
print("\n[TEST GROUP 9] Administrative Role Protection")

rate_limiter.reset()

# Regular user (User B) attempts to access admin endpoints
r_admin_forbidden = client.get("/api/v1/admin/users", headers=headers_b)
assert r_admin_forbidden.status_code == 403, f"Expected 403, got {r_admin_forbidden.status_code}"
print("  ✓ Passed: Regular user rejected from /api/v1/admin/users with HTTP 403")

r_stats_forbidden = client.get("/api/v1/admin/system-stats", headers=headers_b)
assert r_stats_forbidden.status_code == 403, f"Expected 403, got {r_stats_forbidden.status_code}"
print("  ✓ Passed: Regular user rejected from /api/v1/admin/system-stats with HTTP 403")

# Login Administrator
r_login_admin = client.post(
    "/api/v1/auth/login",
    json={"email": "admin@nasa.spaceapps.org", "password": "NasaSpaceApps2026!"}
)
assert r_login_admin.status_code == 200
admin_token = r_login_admin.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Administrator accesses admin stats
r_stats_ok = client.get("/api/v1/admin/system-stats", headers=admin_headers)
assert r_stats_ok.status_code == 200, f"Expected 200 for admin, got {r_stats_ok.status_code}"
stats = r_stats_ok.json()
assert "total_registered_users" in stats, "Missing telemetry stats in admin response"
print("  ✓ Passed: Administrator can access system telemetry stats (HTTP 200)")


# =============================================================================
# [TEST GROUP 10] Secure Logging & Redaction Verification
# =============================================================================
print("\n[TEST GROUP 10] Secure Logging & Credential Redaction")

sample_log_with_bearer = "Incoming request with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.signature123"
sanitized_bearer = CredentialSanitizingFilter.sanitize_string(sample_log_with_bearer)
assert "Bearer [REDACTED_TOKEN]" in sanitized_bearer
assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in sanitized_bearer
print("  ✓ Passed: Bearer tokens redacted in log strings")

sample_log_with_password = 'User login attempt: {"email": "user@nasa.org", "password": "SuperSecretPassword123!"}'
sanitized_password = CredentialSanitizingFilter.sanitize_string(sample_log_with_password)
assert '"password": "[REDACTED_PASSWORD]"' in sanitized_password
assert "SuperSecretPassword123!" not in sanitized_password
print("  ✓ Passed: Passwords redacted in log strings")

sample_log_with_key = "Connecting to NASA API with api_key=DEMO_SECRET_KEY_12345"
sanitized_key = CredentialSanitizingFilter.sanitize_string(sample_log_with_key)
assert "api_key=[REDACTED_API_KEY]" in sanitized_key
assert "DEMO_SECRET_KEY_12345" not in sanitized_key
print("  ✓ Passed: API keys redacted in log strings")


# =============================================================================
# [TEST GROUP 11] Safe Error Responses & Pydantic Validation
# =============================================================================
print("\n[TEST GROUP 11] Safe Error Responses & Pydantic Validation")

# Pydantic input validation failure
r_val_err = client.post(
    "/api/v1/auth/register",
    json={"email": "not-an-email", "password": "short"}
)
assert r_val_err.status_code == 422, f"Expected 422, got {r_val_err.status_code}"
err_data = r_val_err.json()
assert err_data.get("status") == "error"
assert "errors" in err_data
assert "timestamp" in err_data
print("  ✓ Passed: Pydantic input validation returns structured diagnostic error (HTTP 422)")

print("\n" + "=" * 65)
print("  ✓ ALL BACKEND HARDENING TESTS PASSED! (100% SUCCESS)")
print("=" * 65 + "\n")
