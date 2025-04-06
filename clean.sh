#!/bin/sh

cd tileserver-data

rm -f polycampus.mbtiles

cd ..

cd osm

rm -f output.geojson polycampus.geojson polycampus.osm.pbf polycampus.osrm.*
