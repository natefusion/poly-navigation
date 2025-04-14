#!/bin/sh

cd tileserver-data

rm -f polycampus.mbtiles

cd ..


rm -f public/functions.js public/output.geojson
rm -rf public
rm -rf dist/

cd osm

rm -f polycampus.geojson polycampus.osm.pbf polycampus.osrm.*
