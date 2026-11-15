$layers = @(
  @{ id = 'True-Color'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-05-15/GoogleMapsCompatible_Level9/2/1/2.jpg' },
  @{ id = 'LST-Day'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/2024-05-15/GoogleMapsCompatible_Level7/2/1/2.png' },
  @{ id = 'MUR-SST'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2024-05-15/GoogleMapsCompatible_Level7/2/1/2.png' },
  @{ id = 'NDVI-8Day'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-05-16/GoogleMapsCompatible_Level9/2/1/2.png' },
  @{ id = 'Sea-Ice'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Sea_Ice/default/2024-05-15/GoogleMapsCompatible_Level7/2/1/2.png' },
  @{ id = 'Cloud-Opt'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Cloud_Optical_Thickness/default/2024-05-15/GoogleMapsCompatible_Level7/2/1/2.png' },
  @{ id = 'Aerosol'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Aerosol/default/2024-05-15/GoogleMapsCompatible_Level6/2/1/2.png' },
  @{ id = 'Precip'; url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/AIRS_Precipitation_Day/default/2024-05-15/GoogleMapsCompatible_Level6/2/1/2.png' }
)

foreach ($l in $layers) {
  try {
    $resp = Invoke-WebRequest -Uri $l.url -Method Head -TimeoutSec 10 -UserAgent 'EarthJukebox/1.0'
    Write-Host ($l.id + ": Status " + $resp.StatusCode + " (" + $resp.Headers['Content-Type'] + ", " + $resp.Headers['Content-Length'] + " bytes)")
  } catch {
    Write-Host ($l.id + ": Error - " + $_.Exception.Message)
  }
}
