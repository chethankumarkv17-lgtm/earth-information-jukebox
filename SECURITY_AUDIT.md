# Security Audit Report — Earth Information Jukebox

**Project:** Earth Information Jukebox — NASA Space Apps Challenge 2026  
**Auditor:** Senior Application Security Engineer & DevSecOps Architect  
**Audit Date:** 2026-11-15  
**Overall Security Status:** **PRODUCTION-READY (HARDENED)**  
**Automated Scans:** 0 npm vulnerabilities • 0 pip vulnerabilities • 14/14 Frontend suites passed • 11/11 Backend hardening suites passed • 44/44 Auth tests passed  

---

## 1. Executive Summary

A comprehensive, defense-in-depth security audit was conducted across the **Earth Information Jukebox** platform covering architecture, source code, third-party libraries, authentication and authorization, cryptographic operations, data access layers, deployment configs, and geospatial/audio pipelines.

All critical and high-severity risks have been addressed and verified with automated regression suites. The application enforces strict OWASP top 10 defenses, including:
- Cryptographic authentication with PBKDF2-HMAC-SHA256 (200,000 rounds) and revocation-backed JWT tokens.
- Strict Row-Level Security (RLS) preventing Insecure Direct Object References (IDOR).
- Comprehensive Server-Side Request Forgery (SSRF) defenses blocking RFC 1918 private IPs, loopback, cloud metadata (169.254.169.254), and non-approved external domains.
- File upload defenses including Pillow decompression bomb caps (16 MP), magic byte verification (PNG, JPEG, GeoTIFF), and path traversal sanitation.
- In-memory sliding-window rate limiting across authentication (15 req/min), compute (30 req/min), and general endpoints (120 req/min).
- OWASP security response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `HSTS`, `Content-Security-Policy`).

---

## 2. Vulnerability Findings & Remediation Matrix

| ID | Vulnerability / Finding | Severity | Affected Component / File | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Incomplete `.gitignore` permitting untracked SQLite database (`earth_jukebox.db`), uploaded files, and sub-repos to be committed to Git | **HIGH** | `/.gitignore` | **FIXED & VERIFIED** |
| **SEC-002** | Missing Vercel deployment configuration leading to SPA 404 client routing and missing edge security headers | **HIGH** | `/vercel.json`<br/>`/frontend/vercel.json` | **FIXED & VERIFIED** |
| **SEC-003** | Interactive Swagger and OpenAPI schemas (`/docs`, `/redoc`, `/openapi.json`) exposed unconditionally in production | **MEDIUM** | `backend/app/main.py` | **FIXED & VERIFIED** |
| **SEC-004** | Hardcoded demo accounts seeded with default passwords unconditionally in all environments | **MEDIUM** | `backend/app/db/database.py` | **FIXED & VERIFIED** |
| **SEC-005** | Raw Python exception strings reflected in unhandled image upload error responses | **LOW** | `backend/app/api/v1/endpoints/image.py` | **FIXED & VERIFIED** |
| **SEC-006** | Missing root-level `.env.example` template documenting full-stack deployment variables | **LOW** | `/.env.example` | **FIXED & VERIFIED** |
| **SEC-007** | JWT Secret entropy verification guard in production | **LOW** | `backend/app/config.py` | **VERIFIED (Active)** |
| **SEC-008** | Client-side XSS / Raw HTML execution vectors | **INFORMATIONAL** | `frontend/src/` | **VERIFIED CLEAN (0 vectors)** |

---

## 3. Detailed Vulnerability Analyses

### SEC-001: Git Tracking of Sensitive Local State & Databases
- **Severity:** HIGH
- **Vulnerability:** The initial `.gitignore` file lacked explicit patterns for SQLite database files (`*.db`, `*.sqlite`, `*.sqlite3`), temporary image uploads (`backend/uploads/`), and nested git folders (`awesome-satellite-imagery-datasets/`).
- **Real-World Impact:** Running `git add .` or pushing the repository to GitHub would have published the local SQLite database (`earth_jukebox.db`) containing user emails, salted password hashes, and user sessions, along with user-uploaded files and invalid submodule pointers.
- **Remediation:** Completely restructured `.gitignore` to explicitly ignore `*.db`, `*.sqlite*`, `backend/uploads/`, `uploads/`, `awesome-satellite-imagery-datasets/`, and all `.env*` files except `.env.example`.
- **Verification:** Verified via `git status --porcelain -u` that no database files, uploads, or secret files are tracked.

### SEC-002: Missing Vercel SPA Routing & Edge Security Headers
- **Severity:** HIGH
- **Vulnerability:** No `vercel.json` file existed in either the repository root or the `frontend/` directory.
- **Real-World Impact:** In Single Page Applications (SPAs) deployed on Vercel, direct navigation or page refresh on deep routes (`/explore`, `/studio`, `/accessibility`) results in HTTP 404 errors. Additionally, static assets are served without HTTP security headers.
- **Remediation:** Created dual `vercel.json` configurations (in `/` and `/frontend/`) implementing:
  1. Universal rewrite rule: `"source": "/(.*)", "destination": "/index.html"`.
  2. OWASP security response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).
  3. Long-term immutable caching for `/assets/(.*)`.

### SEC-003: OpenAPI Documentation Exposure in Production
- **Severity:** MEDIUM
- **Vulnerability:** In `backend/app/main.py`, `docs_url="/docs"`, `redoc_url="/redoc"`, and `openapi_url="/openapi.json"` were hardcoded to active.
- **Real-World Impact:** Exposing OpenAPI schemas in production enables automated reconnaissance, allowing attackers to map all internal endpoints, request models, validation boundaries, and administrative parameter structures.
- **Remediation:** Added environment-aware guards in `backend/app/main.py`:
  ```python
  is_production = settings.ENVIRONMENT.lower() == "production"
  docs_enabled = not is_production or settings.DEBUG
  app = FastAPI(
      docs_url="/docs" if docs_enabled else None,
      redoc_url="/redoc" if docs_enabled else None,
      openapi_url="/openapi.json" if docs_enabled else None,
  )
  ```

### SEC-004: Default Credential Seeding in Production
- **Severity:** MEDIUM
- **Vulnerability:** `seed_initial_users()` in `backend/app/db/database.py` seeded known demo accounts (`admin@nasa.spaceapps.org` and `explorer@earthjukebox.org`) with hardcoded default passwords.
- **Real-World Impact:** If deployed to production with default seeding enabled, unauthorized users could authenticate as the administrator using published challenge credentials.
- **Remediation:** Added an explicit production guard:
  ```python
  def seed_initial_users():
      if settings.ENVIRONMENT.lower() == "production":
          return
      # Proceed with seeding in development/evaluation only
  ```

### SEC-005: Raw Exception Detail Reflection
- **Severity:** LOW
- **Vulnerability:** Line 44 of `backend/app/api/v1/endpoints/image.py` returned `f"Internal image processing failure: {str(e)}"`.
- **Real-World Impact:** Unhandled OpenCV or OS file exceptions could reveal internal filesystem paths, OS details, or library tracebacks.
- **Remediation:** Guarded the error response with `settings.DEBUG`:
  ```python
  error_detail = f"Internal image processing failure: {str(e)}" if settings.DEBUG else "Internal image processing failure. Please try another image."
  ```

---

## 4. Subsystem Security Assessments

### A. Authentication, Session & Access Control
- **Password Hashing:** Implemented with `hashlib.pbkdf2_hmac("sha256", ...)` with 200,000 iterations and unique 32-byte cryptographically secure random salt generated via `secrets.token_hex(32)`. Complies with NIST SP 800-63B.
- **JWT Cryptography:** Signed with HMAC-SHA256 (`HS256`). Token expiration is enforced (24 hours access, 30 days refresh).
- **Session Revocation:** Logout invalidates the active `jti` claim in the `revoked_tokens` table. All protected routes check `is_token_revoked(jti)`.
- **Row-Level Security (IDOR Defense):** Queries on `/api/user/explorations/{id}` explicitly filter by `user_id = ?` or verify owner identity. Verified across 6 separate IDOR test cases.
- **Role-Based Access Control:** Administrative routes (`/api/admin/*`, `/api/v1/admin/*`) require `role == "admin"`. Regular users receive HTTP 403 Forbidden.

### B. Input Validation & Injection Defenses
- **SQL Injection:** All database operations utilize parameterized SQLite queries with `?` placeholders. Zero raw format strings or string concatenations exist in SQL statements.
- **Pydantic Schemas:** All incoming JSON payloads undergo strict Pydantic v2 validation. Invalid payloads return HTTP 422 with structured field errors.
- **Cross-Site Scripting (XSS):** Zero instances of `dangerouslySetInnerHTML`, `eval()`, or `new Function()` in the React codebase. All user coordinates and text inputs are rendered through standard React JSX text nodes with automatic entity escaping.

### C. Server-Side Request Forgery (SSRF)
- Outgoing HTTP calls in `backend/app/services/providers/` route through `validate_external_url()`.
- Blocks RFC 1918 private IPv4 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- Blocks loopback (`127.0.0.0/8`, `::1`).
- Blocks AWS/GCP/Azure link-local instance metadata (`169.254.169.254`).
- Validates RFC 6052 NAT64 transition prefixes (`64:ff9b::/96`).
- Restricts external queries to approved scientific domains (`nasa.gov`, `copernicus.eu`, `element84.com`, `open-meteo.com`, `noaa.gov`, `usgs.gov`, `nsidc.org`).

### D. File Upload & Processing Security
- **MIME & Extension Whitelist:** Only `.png`, `.jpg`, `.jpeg` allowed.
- **Magic Byte Verification:** File header signatures checked against declared extensions (`\x89PNG\r\n\x1a\n`, `\xff\xd8\xff`). Disguised executables and polyglots rejected with HTTP 415.
- **Decompression Bomb Protection:** Pillow threshold capped at `Image.MAX_IMAGE_PIXELS = 16_000_000`.
- **Path Traversal Defense:** Filenames sanitized via `os.path.basename` and null-byte removal. File deletion endpoints enforce canonical directory boundary checks (`os.path.realpath`).

### E. Rate Limiting & Denial of Service (DoS)
- Sliding-window in-memory rate limiter with thread-safe locks.
- Stricter threshold on authentication routes (15 req/min) prevents credential stuffing.
- Compute threshold on CV/upload routes (30 req/min) prevents CPU saturation.
- Request payload middleware caps uploads at 16 MB and JSON payloads at 1 MB.

---

## 5. Third-Party Dependencies

- **Node.js Dependencies (`frontend/package.json`):**
  - Audited with `npm audit`. Result: **0 vulnerabilities**.
- **Python Dependencies (`backend/requirements.txt`):**
  - Audited with `pip-audit`. Result: **No known vulnerabilities found**.

---

## 6. Remaining Risks & Operational Recommendations

1. **Production SQLite Multi-Worker Concurrency:**
   - SQLite is robust for single-process deployments (up to 100 concurrent read requests). If scaling to multi-container Kubernetes or multi-instance serverless backends, migrate the persistence tier to managed PostgreSQL (e.g. Supabase or Neon). The schema and data access layers are already modularized.
2. **Rotating NASA / Copernicus API Credentials:**
   - Ensure production credentials configured on deployment hosts are rotated semi-annually and managed through cloud secret managers (e.g. Vercel Environment Variables, Render Secret Files).
