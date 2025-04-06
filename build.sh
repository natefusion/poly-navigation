#!/bin/sh

if ! command -v "osmium" 2>&1 >/dev/null; then
    echo "please install https://github.com/osmcode/osmium-tool"
    exit 1
fi

cd osm

if [ -e "polycampus.osm.pbf" ]; then
    osmium renumber -o polycampus.osm.pbf polycampus.osm --overwrite
    docker run -it --rm -v $(pwd):/data ghcr.io/systemed/tilemaker:master /data/polycampus.osm.pbf /data/polycampus.mbtiles
    mv -f polycampus.mbtiles ../tileserver-data/
else
    echo "You didn't export polycampus.osm.pbf from JOSM! You need to download the plugin to export .pbf files first!"
    exit 1
fi







