import sys

def check(mod_name):
    try:
        mod = __import__(mod_name)
        ver = getattr(mod, '__version__', 'installed')
        print(f"✓ {mod_name}: {ver}")
        return True
    except ImportError:
        print(f"✗ {mod_name}: NOT installed")
        return False

print("Python executable:", sys.executable)
check("numpy")
check("pandas")
check("xarray")
check("rasterio")
check("cv2")
check("PIL")
check("scipy")
check("fastapi")
check("httpx")
check("pydantic")
