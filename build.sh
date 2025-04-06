#!/bin/sh

if ! command -v "osmium" 2>&1 >/dev/null; then
    echo "please install https://github.com/osmcode/osmium-tool"
    exit 1
fi

cd osm

# Create data for tileserver-gl
osmium renumber -o polycampus.osm.pbf polycampus.osm --overwrite
docker run -it --rm -v $(pwd):/data ghcr.io/systemed/tilemaker:master /data/polycampus.osm.pbf /data/polycampus.mbtiles
mv -f polycampus.mbtiles ../tileserver-data/


# Create search query data
osmium export -o polycampus.geojson polycampus.osm --overwrite
node filter-search-queries.js > output.geojson

# Create data for routing server
docker run -t -v $(pwd):/data ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/foot.lua /data/polycampus.osm.pbf
docker run -t -v $(pwd):/data ghcr.io/project-osrm/osrm-backend osrm-partition /data/polycampus.osrm
docker run -t -v $(pwd):/data ghcr.io/project-osrm/osrm-backend osrm-customize /data/polycampus.osrm
