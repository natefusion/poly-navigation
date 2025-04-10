@echo off
REM Check if osmium is installed
where osmium >nul 2>&1
if errorlevel 1 (
    echo please install https://github.com/osmcode/osmium-tool
    exit /b 1
)

REM Change directory to "osm"
cd osm

REM Create data for tileserver-gl
osmium renumber -o polycampus.osm.pbf polycampus.osm --overwrite
docker run -it --rm -v "%cd%":/data ghcr.io/systemed/tilemaker:master --input /data/polycampus.osm.pbf --output /data/polycampus.mbtiles --config /data/tilemaker-config.json --process /data/tilemaker-process.lua
move /Y polycampus.mbtiles ..\tileserver-data\

REM Create search query data
osmium export -o polycampus.geojson polycampus.osm --overwrite
node filter-search-queries.js > output.geojson

REM Create data for routing server
docker run -t -v "%cd%":/data ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/foot.lua /data/polycampus.osm.pbf
docker run -t -v "%cd%":/data ghcr.io/project-osrm/osrm-backend osrm-partition /data/polycampus.osrm
docker run -t -v "%cd%":/data ghcr.io/project-osrm/osrm-backend osrm-customize /data/polycampus.osrm
