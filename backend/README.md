# EARTH JUKEBOX — Backend API
### NASA Space Apps Challenge 2026

## Quick Start (Windows PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env       # Edit with your API keys (optional)
python run.py              # Starts at http://127.0.0.1:8000
```

## Environment Variables

Copy `.env.example` to `.env`. All NASA GIBS endpoints work without API keys.

| Variable | Required | Description |
|----------|----------|-------------|
| `NASA_GIBS_BASE_URL` | No | NASA GIBS WMTS URL (default provided) |
| `COPERNICUS_CLIENT_ID` | No | Copernicus CDSE OAuth2 client ID |
| `COPERNICUS_CLIENT_SECRET` | No | Copernicus CDSE OAuth2 client secret |
| `CACHE_TTL_SECONDS` | No | In-memory cache TTL (default: 3600) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/earth/layers` | 12 NASA GIBS layers across 6 domains |
| `GET` | `/api/earth/imagery` | Live satellite imagery (raw or base64 JSON) |
| `GET` | `/api/earth/region` | Scientific measurements + sonification profile |
| `GET` | `/api/earth/datasets` | 7 satellite platform attributions with citations |
| `POST` | `/api/earth/analyze` | File upload or bbox analysis with sonification |
| `GET` | `/api/earth/timeline` | Multi-year time-series with acoustic pitch mapping |
| `GET` | `/api/earth/sentinel` | Sentinel-2 L2A STAC granule search |

All endpoints are also available under `/api/v1/earth/*`.

Interactive docs: http://127.0.0.1:8000/docs

## Testing

```powershell
.\venv\Scripts\python test_earth_api.py
# 15/15 tests ✓
```

## Architecture

```
app/
├── api/v1/endpoints/earth.py       # 7 REST endpoints
├── services/
│   ├── cache.py                    # Thread-safe LRU/TTL cache
│   ├── geospatial/
│   │   └── geospatial_engine.py    # BBox, tile math, feature extraction
│   ├── providers/
│   │   ├── gibs_client.py          # NASA GIBS WMTS fetcher
│   │   └── copernicus_client.py    # Sentinel-2 STAC search
│   └── processors/                 # 6 domain processors
│       ├── satellite_processor.py  # Surface reflectance, cloud %
│       ├── ocean_processor.py      # SST (°C/K), chlorophyll-a (mg/m³)
│       ├── temperature_processor.py# LST (°C/K), thermal anomaly %
│       ├── cloud_processor.py      # Cloud fraction %, optical depth τ
│       ├── vegetation_processor.py # NDVI (-1 to +1), canopy fraction %
│       └── ice_processor.py        # Sea ice %, albedo (0-1), melt leads
└── schemas/earth.py                # Pydantic v2 models
```
