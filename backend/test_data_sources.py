"""
Test NASA POWER and Open-Meteo APIs for real numerical Earth observation data.
"""
import httpx

def test_nasa_power():
    print("Testing NASA POWER API...")
    url = "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,WS10M,RH2M,ALLSKY_SFC_SW_DWN&community=RE&longitude=75.5681&latitude=13.9299&start=20240501&end=20240503&format=JSON"
    try:
        resp = httpx.get(url, timeout=15)
        print("NASA POWER Status:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            params = data.get("properties", {}).get("parameter", {})
            print("  Parameters received:", list(params.keys()))
            for k in ["T2M", "PRECTOTCORR", "WS10M"]:
                if k in params:
                    print(f"  {k}: {params[k]}")
            return True
    except Exception as e:
        print("NASA POWER Error:", e)
    return False

def test_open_meteo():
    print("\nTesting Open-Meteo Historical Weather API...")
    url = "https://archive-api.open-meteo.com/v1/archive?latitude=13.9299&longitude=75.5681&start_date=2024-05-01&end_date=2024-05-03&daily=temperature_2m_mean,precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean&timezone=auto"
    try:
        resp = httpx.get(url, timeout=15)
        print("Open-Meteo Status:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            daily = data.get("daily", {})
            print("  Variables received:", list(daily.keys()))
            print("  Dates:", daily.get("time"))
            print("  Temperature (°C):", daily.get("temperature_2m_mean"))
            print("  Precipitation (mm):", daily.get("precipitation_sum"))
            print("  Wind Speed (km/h):", daily.get("windspeed_10m_max"))
            return True
    except Exception as e:
        print("Open-Meteo Error:", e)
    return False

if __name__ == "__main__":
    p_ok = test_nasa_power()
    m_ok = test_open_meteo()
    print(f"\nResults: NASA POWER={p_ok}, Open-Meteo={m_ok}")
