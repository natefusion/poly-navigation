docker run --rm -it -v $(pwd)/tileserver-data:/data -p 8080:8080 maptiler/tileserver-gl:latest &

npm run dev &

cd osm

if [ -e "polycampus.geojson" ]; then
    node filter-search-queries.js > output.geojson
else
    echo "You didn't export polycampus.geojson from JOSM!"
fi
