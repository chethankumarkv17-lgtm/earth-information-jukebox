# Earth Information Jukebox — Installation & Deployment Guide

This guide provides instructions to install, configure, verify, and run the **Earth Information Jukebox** on local workstations or production servers for the NASA Space Apps Challenge demonstration.

---

## 1. System Requirements

### Hardware Requirements
- **Processor**: Multi-core 64-bit CPU (Intel i5/i7/i9, AMD Ryzen, Apple Silicon M1/M2/M3).
- **RAM**: 8 GB minimum (16 GB recommended for 3D Cesium tile caching and multi-track audio synthesis).
- **GPU**: Hardware-accelerated WebGL 2.0 capable graphics card.
- **Audio**: Stereo sound output device (headphones recommended for binaural spatial exploration).

### Software Requirements
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended, tested up to Node v26).
- **Python**: v3.10, v3.11, or v3.12 (64-bit).
- **Package Managers**: `npm` (v9+) and `pip` (v23+).
- **Modern Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari with WebGL and Web Audio API enabled.

---

## 2. Quickstart (Development Setup)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/nasa-project-by-antigravity.git
cd "nasa project by antigravity"
```

---

### Step 2: Configure and Start the FastAPI Backend

#### On Windows (PowerShell):
```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install scientific requirements
pip install --upgrade pip
pip install -r requirements.txt

# Start the FastAPI server (running on port 8000)
python run.py
```
*Note: If PowerShell execution policies prevent script activation, run:*
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

#### On macOS / Linux:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python run.py
```
The backend API server will be available at: **`http://127.0.0.1:8000`**  
OpenAPI / Swagger documentation: **`http://127.0.0.1:8000/docs`**

---

### Step 3: Configure and Start the React Frontend

Open a new terminal session in the project root:

#### On Windows:
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

#### On macOS / Linux:
```bash
cd frontend
npm install
npm run dev
```

The frontend application will be live at: **`http://localhost:5173`**

---

## 3. Environment Variables

### Backend Configuration (`backend/.env`)
Create `backend/.env` (a template is provided in `backend/.env.example`):
```env
# Application Settings
APP_NAME="NASA Earth Information Jukebox"
ENVIRONMENT="production"
PORT=8000
HOST="127.0.0.1"

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# Data Source Cache Time-To-Live (seconds)
CACHE_TTL_SECONDS=3600

# Optional: Copernicus Data Space STAC Credentials (for high-volume direct tile downloads)
COPERNICUS_CLIENT_ID=""
COPERNICUS_CLIENT_SECRET=""
```

### Frontend Configuration (`frontend/.env`)
```env
VITE_API_BASE_URL="http://127.0.0.1:8000"
VITE_ENABLE_CESIUM_ION=true
```

---

## 4. Running the Complete Automated Test Suites

### Backend Test Suite
```bash
cd backend
.\venv\Scripts\python test_phase1_foundation.py
.\venv\Scripts\python test_earth_api.py
.\venv\Scripts\python test_earth_data_sources.py
.\venv\Scripts\python test_earth_process_api.py
.\venv\Scripts\python test_data_processing_engine.py
.\venv\Scripts\python audit_backend_performance.py
```

### Frontend Test Suite
```bash
cd frontend
node run_audit_tests.cjs
```
This executes all 14 frontend test suites (accessibility, sonification mappings, synchronized timelines, comparative hub, and Cesium 3D globe).

---

## 5. Production Build & Air-Gapped / Offline Operation

### Building the Frontend for Production:
```bash
cd frontend
npm.cmd run build
```
The compiled bundle will be output to `frontend/dist/` with automated code-splitting, producing standalone, highly optimized chunks for CesiumJS, Framer Motion, and Leaflet.

### Air-Gapped / Offline Demonstration:
The application includes self-contained offline fallback datasets:
- Local historical GISTEMP, Sea Ice, $\text{CO}_2$, and Sea Level chronologies require zero internet connection.
- Local sample GeoTIFF and NetCDF files in `backend/app/` provide full demonstration capability if live satellite internet is restricted.
