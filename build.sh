#!/bin/sh

cd osm

# .pbf file must be generated through josm first

if [ -e "polycampus.osm.pbf" ]; then
    docker run -it --rm -v $(pwd):/data ghcr.io/systemed/tilemaker:master /data/polycampus.osm.pbf /data/polycampus.mbtiles
    mv polycampus.mbtiles ../tileserver-data/
else
    echo "You didn't export polycampus.osm.pbf from JOSM! You need to download the plugin to export .pbf files first!"
fi







