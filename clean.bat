@echo off
REM Change to the tileserver-data directory and remove polycampus.mbtiles
cd tileserver-data
del /Q polycampus.mbtiles

REM Move back up one directory, then into the osm folder
cd ..
cd osm
del /Q output.geojson polycampus.geojson polycampus.osm.pbf polycampus.osrm.*
