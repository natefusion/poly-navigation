import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import Fuse from 'fuse.js';

import './functions.js';


const fuseOptions = {
	// isCaseSensitive: false,
	// includeScore: false,
	// ignoreDiacritics: false,
	// shouldSort: true,
	// includeMatches: false,
	// findAllMatches: false,
	// minMatchCharLength: 1,
	// location: 0,
	// threshold: 0.6,
	// distance: 100,
	// useExtendedSearch: false,
	// ignoreLocation: false,
	// ignoreFieldNorm: false,
	// fieldNormWeight: 1,
	keys: [
		"name",
		"addr:unit"
	]
};

const fuse = new Fuse(geo, fuseOptions);

searchbox.addEventListener("input", (e) => {
    var text = searchbox.value;
    const items = fuse.search(text);
    if (items.length > 0) {
        let geometry = items[0].item.geometry;

        let source = map.getSource('outline');
        if (source) {
            map.style.setGeoJSONSourceData('outline', {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": geometry
                    }
                ]
            });
        } else {

            map.addSource('outline', {
                'type': 'geojson',
                'data':{
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "properties": {},
                            "geometry":  geometry
                        }
                    ]
                }
            });

            map.addLayer({
                'id': 'outline',
                'type': 'line',
                'source': 'outline',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#F00',
                    'line-width': 8
                }
            });
        }

        let list = '';
        for (const item of items) {
            list += `<button onclick="load_item_details('${item.refIndex}')" class="button" popovertarget="item_details">${item.item.name}</button>`
        }

        searchresults.innerHTML = list;
    } else {
        searchresults.innerHTML = '';
    }
});

// Initialize the map
const map = new maplibregl.Map({
    container: 'map', // ID of the div where the map will be rendered
    style: 'http://localhost:8080/styles/osm-real/style.json',
    center: [-81.848914, 28.148263], // Longitude, Latitude
    zoom: 17 // Zoom level
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl());


const marker1 = new maplibregl.Marker({draggable: true})
      .setLngLat([-81.848914, 28.148263])
      .addTo(map);

const marker2 = new maplibregl.Marker({draggable: true})
      .setLngLat([-81.848914, 28.148263])
      .addTo(map);

function reRoute() {
    const src = marker1.getLngLat();
    const dst = marker2.getLngLat();

    const str = 'http://0.0.0.0:5000/route/v1/foot/' + src.lng + ',' + src.lat + ';' + dst.lng + ',' + dst.lat + '?geometries=geojson';
    const route = httpGet(str);
    const json_route = JSON.parse(route);

    let source = map.getSource('route');
    if (source) {
        map.style.setGeoJSONSourceData('route', {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": json_route["routes"][0]["geometry"]
                }
            ]
        });
    } else {
        map.addSource('route', {
            'type': 'geojson',
            'data':{
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": json_route["routes"][0]["geometry"]
                    }
                ]
            }
        });
        
        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#888',
                'line-width': 8
            }
        });
    }
}

marker1.on('dragend', () => {
    const lngLat = marker1.getLngLat();
    coordinates.style.display = 'block';
    coordinates.innerHTML =
        `Longitude: ${lngLat.lng}<br />Latitude: ${lngLat.lat}`;

    reRoute();
});

marker2.on('dragend', () => {
    const lngLat = marker2.getLngLat();
    coordinates.style.display = 'block';
    coordinates.innerHTML =
        `Longitude: ${lngLat.lng}<br />Latitude: ${lngLat.lat}`;

    reRoute();
});

navigate_button.onclick = function() {
    searchui.style.display = 'none';
    navigationui.style.display = 'flex';

    if (selecting_end_location) {
        marker2.setLngLat([geo[end_location_idx][0],geo[end_location_idx][1]]);
        end_location_name.innerHTML = item_name.innerHTML;
    } else {
        marker1.setLngLat([geo[start_location_idx][0],geo[start_location_idx][1]]);
        start_location_name.innerHTML = item_name.innerHTML;
    }
};

begin_navigation.onclick = reRoute;

exit_navigation.onclick = function() {
    searchui.style.display = 'flex';
    navigationui.style.display = 'none';

    map.removeLayer('route');
    map.removeSource('route');

    searchbox.value = '';
    searchresults.innerHTML = '';
};

