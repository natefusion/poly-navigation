docker run -d --rm -it -v $(pwd)/tileserver-data:/data -p 8080:8080 maptiler/tileserver-gl:latest
docker run -d -t -i -p 5000:5000 -v $(pwd)/osm:/data ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/polycampus.osrm
npm run dev &

wait
