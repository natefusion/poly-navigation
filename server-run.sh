#!/bin/sh

mkdir -p public

cp osm/output.geojson public/
cp functions.js public/

npm run build
docker-compose up &

wait
