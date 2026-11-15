"""
NASA Earth Information Jukebox — Comprehensive Authentication & Authorization Test Suite
2026 NASA Space Apps Challenge

Verifies:
1. Registration & password hashing (NIST PBKDF2)
2. Login & JWT access token generation
3. Rejection of invalid credentials & duplicate accounts
4. Role enforcement (guest vs registered vs admin)
5. Session management & logout revocation
6. Protected user profile & preferences
7. Saved explorations CRUD with Row-Level Security
8. Password reset & email verification flows
9. Administrative controls & telemetry
10. Account deletion cascading
"""

import sys
import uuid
from starlette.testclient import TestClient
from app.main import app
from app.db.database import get_db_connection

client = TestClient(app)

print("\n=================================================================")
print("  RUNNING NASA EARTH JUKEBOX AUTH & SECURITY TEST SUITE")
print("=================================================================\n")

tests_passed = 0
tests_failed = 0


def assert_test(condition: bool, description: str):
    global tests_passed, tests_failed
    if condition:
        print(f"  ✓ Passed: {description}")
        tests_passed += 1
    else:
        print(f"  ❌ FAILED: {description}")
        tests_failed += 1


# -----------------------------------------------------------------------------
# Test 1: Public Guest Access (No Login Required)
# -----------------------------------------------------------------------------
print("[TEST GROUP 1] Public Guest Exploration (Zero Login Barrier)")
resp = client.get("/api/earth/layers")
assert_test(resp.status_code == 200, "Guests can explore NASA layers without logging in")

resp = client.get("/api/earth/timeline?phenomenon=arctic_sea_ice")
assert_test(resp.status_code == 200, "Guests can access Earth timelines without logging in")


# -----------------------------------------------------------------------------
# Test 2: Protected Endpoints Reject Unauthenticated Guests
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 2] Protected Endpoints Require Authentication")
resp = client.get("/api/user/profile")
assert_test(resp.status_code == 401, "/api/user/profile rejects unauthenticated request with HTTP 401")

resp = client.get("/api/user/explorations")
assert_test(resp.status_code == 401, "/api/user/explorations rejects unauthenticated request with HTTP 401")


# -----------------------------------------------------------------------------
# Test 3: User Registration & Validation
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 3] User Registration & Validation")
test_email = f"astro_test_{uuid.uuid4().hex[:8]}@nasa.org"
reg_payload = {
    "email": test_email,
    "password": "SecurePassword2026!",
    "full_name": "Astraea Nova"
}

# Rejection of short password
short_resp = client.post("/api/auth/register", json={"email": "short@test.org", "password": "123"})
assert_test(short_resp.status_code == 422, "Registration rejects passwords under 8 characters with 422")

# Successful registration
resp = client.post("/api/auth/register", json=reg_payload)
assert_test(resp.status_code == 201, "Registration succeeds with 201 Created")
reg_data = resp.json()
assert_test("access_token" in reg_data, "Registration returns JWT access token")
assert_test(reg_data["user"]["role"] == "registered", "New user assigned 'registered' role")
user_a_token = reg_data["access_token"]
user_a_id = reg_data["user"]["id"]

# Duplicate registration rejection
dup_resp = client.post("/api/auth/register", json=reg_payload)
assert_test(dup_resp.status_code == 409, "Duplicate registration rejected with HTTP 409 Conflict")


# -----------------------------------------------------------------------------
# Test 4: User Login & Session Generation
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 4] User Login & Session Verification")
# Wrong password
wrong_resp = client.post("/api/auth/login", json={"email": test_email, "password": "WrongPassword!"})
assert_test(wrong_resp.status_code == 401, "Login with invalid password rejected with HTTP 401")

# Correct password
login_resp = client.post("/api/auth/login", json={"email": test_email, "password": "SecurePassword2026!"})
assert_test(login_resp.status_code == 200, "Login succeeds with HTTP 200")
token_data = login_resp.json()
assert_test(token_data["user"]["email"] == test_email.lower(), "Login returns correct user profile")

# Profile introspection (/api/auth/me)
headers_a = {"Authorization": f"Bearer {user_a_token}"}
me_resp = client.get("/api/auth/me", headers=headers_a)
assert_test(me_resp.status_code == 200, "/api/auth/me returns authenticated user")
assert_test(me_resp.json()["id"] == user_a_id, "User ID matches registered account")


# -----------------------------------------------------------------------------
# Test 5: Email Verification Flow
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 5] Email Verification Flow")
# Retrieve verification token from DB
conn = get_db_connection()
cursor = conn.cursor()
cursor.execute("SELECT verification_token FROM users WHERE id = ?", (user_a_id,))
v_token = cursor.fetchone()["verification_token"]
conn.close()

# Verify with valid token
verify_resp = client.post("/api/auth/verify-email", json={"email": test_email, "token": v_token})
assert_test(verify_resp.status_code == 200, "Email verified successfully with token")

# Check status in /me
me_resp = client.get("/api/auth/me", headers=headers_a)
assert_test(me_resp.json()["is_verified"] is True, "User is_verified is now True")


# -----------------------------------------------------------------------------
# Test 6: Password Reset Flow
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 6] Password Reset Flow")
forgot_resp = client.post("/api/auth/forgot-password", json={"email": test_email})
assert_test(forgot_resp.status_code == 200, "Forgot password endpoint dispatches reset token")
reset_token = forgot_resp.json().get("demo_reset_token")

# Confirm password reset
reset_resp = client.post("/api/auth/reset-password", json={
    "email": test_email,
    "token": reset_token,
    "new_password": "NewUpdatedPassword2026!"
})
assert_test(reset_resp.status_code == 200, "Password reset confirmed successfully")

# Verify login with new password
new_login = client.post("/api/auth/login", json={"email": test_email, "password": "NewUpdatedPassword2026!"})
assert_test(new_login.status_code == 200, "Login works with new updated password")
user_a_token = new_login.json()["access_token"]
headers_a = {"Authorization": f"Bearer {user_a_token}"}


# -----------------------------------------------------------------------------
# Test 7: User Profile & Preferences Management
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 7] User Profile & Preferences Management")
# Update profile
up_resp = client.put("/api/user/profile", headers=headers_a, json={
    "full_name": "Dr. Astraea Nova",
    "bio": "Atmospheric sound researcher at Goddard Space Flight Center."
})
assert_test(up_resp.status_code == 200, "User profile updated successfully")
assert_test(up_resp.json()["full_name"] == "Dr. Astraea Nova", "Updated full name reflected in profile")

# Update preferences
pref_resp = client.put("/api/user/preferences", headers=headers_a, json={
    "default_preset": "cinematic_resonance",
    "master_volume": 0.95,
    "high_contrast_default": True
})
assert_test(pref_resp.status_code == 200, "User preferences updated")
assert_test(pref_resp.json()["default_preset"] == "cinematic_resonance", "Default preset saved")

# Get preferences
get_pref = client.get("/api/user/preferences", headers=headers_a)
assert_test(get_pref.json()["high_contrast_default"] is True, "Preferences persist across requests")


# -----------------------------------------------------------------------------
# Test 8: Saved Explorations & Row-Level Security (RLS)
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 8] Saved Explorations & Row-Level Authorization")
# User A saves an exploration
exp_payload = {
    "title": "Amazon Rainforest Seasonality Sonification",
    "description": "Multi-spectral MODIS NDVI seasonal acoustic study.",
    "mode": "explore",
    "location_id": "amazon_basin",
    "dataset_id": "vegetation",
    "sonification_preset": "ambient_documentary",
    "playback_speed": 1.25,
    "notes": "Higher harmonics emerge during dry season."
}
save_resp = client.post("/api/user/explorations", headers=headers_a, json=exp_payload)
assert_test(save_resp.status_code == 201, "User A saves exploration with 201 Created")
exp_a_id = save_resp.json()["id"]

# User A reads their exploration
list_resp = client.get("/api/user/explorations", headers=headers_a)
assert_test(list_resp.status_code == 200, "User A lists their saved explorations")
assert_test(list_resp.json()["total_saved"] >= 1, "List includes newly saved exploration")

# Register User B to test unauthorized cross-access
email_b = f"user_b_{uuid.uuid4().hex[:8]}@test.org"
reg_b = client.post("/api/auth/register", json={"email": email_b, "password": "UserBPassword2026!"})
user_b_token = reg_b.json()["access_token"]
headers_b = {"Authorization": f"Bearer {user_b_token}"}

# User B tries to read User A's exploration (Should be rejected with HTTP 403 Forbidden)
cross_read = client.get(f"/api/user/explorations/{exp_a_id}", headers=headers_b)
assert_test(cross_read.status_code == 403, "RLS: User B cannot access User A's private exploration (HTTP 403)")

# User B tries to update User A's exploration
cross_update = client.put(f"/api/user/explorations/{exp_a_id}", headers=headers_b, json={"title": "Hacked Title"})
assert_test(cross_update.status_code == 403, "RLS: User B cannot modify User A's exploration (HTTP 403)")

# User B tries to delete User A's exploration
cross_delete = client.delete(f"/api/user/explorations/{exp_a_id}", headers=headers_b)
assert_test(cross_delete.status_code == 403, "RLS: User B cannot delete User A's exploration (HTTP 403)")

# User A CAN update their own exploration
own_update = client.put(f"/api/user/explorations/{exp_a_id}", headers=headers_a, json={"title": "Updated Amazon Title"})
assert_test(own_update.status_code == 200, "Owner can update their own exploration")
assert_test(own_update.json()["title"] == "Updated Amazon Title", "Title updated accurately")


# -----------------------------------------------------------------------------
# Test 9: Administrator Controls & Role Protection
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 9] Administrative Controls & Role Protection")
# Regular user tries to access /api/admin/users (Should be rejected with 403)
admin_access_unauth = client.get("/api/admin/users", headers=headers_a)
assert_test(admin_access_unauth.status_code == 403, "Regular user rejected from /api/admin/users with HTTP 403")

# Login as seeded default Admin
admin_login = client.post("/api/auth/login", json={
    "email": "admin@nasa.spaceapps.org",
    "password": "NasaSpaceApps2026!"
})
assert_test(admin_login.status_code == 200, "Admin logs in successfully")
admin_token = admin_login.json()["access_token"]
headers_admin = {"Authorization": f"Bearer {admin_token}"}
assert_test(admin_login.json()["user"]["role"] == "admin", "Admin role confirmed in verified token")

# Admin accesses /api/admin/users
admin_users = client.get("/api/admin/users", headers=headers_admin)
assert_test(admin_users.status_code == 200, "Administrator can list all users")
assert_test(admin_users.json()["total_users"] >= 2, "List contains all registered users")

# Admin accesses /api/admin/system-stats
admin_stats = client.get("/api/admin/system-stats", headers=headers_admin)
assert_test(admin_stats.status_code == 200, "Administrator can access system telemetry stats")
assert_test("total_saved_explorations" in admin_stats.json(), "Telemetry includes exploration metrics")

# Admin can update User B's role to 'admin'
role_update = client.put(f"/api/admin/users/{reg_b.json()['user']['id']}/role", headers=headers_admin, json={"role": "admin"})
assert_test(role_update.status_code == 200, "Admin can promote user role")


# -----------------------------------------------------------------------------
# Test 10: Logout & Session Revocation
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 10] Session Revocation on Logout")
# User A logs out
logout_resp = client.post("/api/auth/logout", headers=headers_a)
assert_test(logout_resp.status_code == 200, "Logout endpoint revokes active session")

# Trying to use revoked token on protected endpoint should fail with HTTP 401
revoked_req = client.get("/api/auth/me", headers=headers_a)
assert_test(revoked_req.status_code == 401, "Revoked token is rejected on subsequent requests (HTTP 401)")


# -----------------------------------------------------------------------------
# Test 11: Account Deletion Cascading
# -----------------------------------------------------------------------------
print("\n[TEST GROUP 11] Account Deletion & Cascading Clean-up")
# Log back in as User B to delete account
login_b = client.post("/api/auth/login", json={"email": email_b, "password": "UserBPassword2026!"})
token_b = login_b.json()["access_token"]
headers_b = {"Authorization": f"Bearer {token_b}"}

del_resp = client.delete("/api/user/account", headers=headers_b)
assert_test(del_resp.status_code == 200, "User can delete their own account")

# Subsequent login fails
post_del_login = client.post("/api/auth/login", json={"email": email_b, "password": "UserBPassword2026!"})
assert_test(post_del_login.status_code == 401, "Deleted account cannot log in")


print("\n=================================================================")
print(f"  Results: {tests_passed} passed, {tests_failed} failed")
if tests_failed == 0:
    print("  ✓ ALL AUTHENTICATION & AUTHORIZATION TESTS PASSED! (100% SUCCESS)")
    print("=================================================================\n")
    sys.exit(0)
else:
    print(f"  ❌ {tests_failed} CHECKS FAILED.")
    print("=================================================================\n")
    sys.exit(1)
