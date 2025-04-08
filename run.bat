@echo off
REM Start the tileserver-gl container in detached mode.
docker run -d --rm -it -v "%cd%\tileserver-data:/data" -p 8080:8080 maptiler/tileserver-gl:latest

REM Start the OSRM routing container in detached mode.
docker run -d -t -i -p 5000:5000 -v "%cd%\osm:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/polycampus.osrm

REM Run the npm development server in the foreground.
npm run dev

REM (Optional) Uncomment the following line if you want the window to wait for a key press after npm run dev exits.
REM pause
