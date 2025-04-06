#!/bin/sh

if ! command -v "osmium" 2>&1 >/dev/null; then
    echo "please install https://github.com/osmcode/osmium-tool"
    exit 1
fi

cd osm

osmium renumber -o polycampus.osm.pbf polycampus.osm --overwrite
docker run -it --rm -v $(pwd):/data ghcr.io/systemed/tilemaker:master /data/polycampus.osm.pbf /data/polycampus.mbtiles
mv -f polycampus.mbtiles ../tileserver-data/

osmium export -o polycampus.geojson polycampus.osm --overwrite
node filter-search-queries.js > output.geojson









