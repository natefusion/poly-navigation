#!/bin/sh

cd tileserver-data

rm -f polycampus.mbtiles

cd ..


rm -f public/functions.js public/output.geojson
rm -d public
rm -rf dist/

cd osm

rm -f output.geojson polycampus.geojson polycampus.osm.pbf polycampus.osrm.*
