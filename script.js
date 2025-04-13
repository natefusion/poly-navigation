import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import OSRMTextInstructions from 'osrm-text-instructions';
const text_instructions = new OSRMTextInstructions('v5');

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

    if (text.length === 0) {
        showme(othersearch);
    } else {
        hideme(othersearch);
    }
            
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
            list += `<button onclick="load_item_details('${item.refIndex}', true)" class="button" popovertarget="item_details">${item.item.name}</button>`
        }

        searchresults.innerHTML = list;
    } else {
        searchresults.innerHTML = '';
    }
});

// Initialize the map
const map = new maplibregl.Map({
    container: 'map', // ID of the div where the map will be rendered
    style: '/tiles/styles/osm-real/style.json',
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

    const str = `/osrm/route/v1/foot/${src.lng},${src.lat};${dst.lng},${dst.lat}?geometries=geojson&steps=true`;
    const route = httpGet(str);
    const json_route = JSON.parse(route);

    const navigation_directions = json_route.routes[0].legs[0].steps.map((step, index) => {
        return text_instructions.compile('en', step);
    });

    load_navigation_directions(navigation_directions);

    let source = map.getSource('route');
    if (source) {
        map.getSource('route').setData(json_route.routes[0].geometry);
    } else {
        map.addSource('route', {
            'type': 'geojson',
            'data':{
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": json_route.routes[0].geometry
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
    showme(coordinates);
    coordinates.classList.remove('hidden');
    coordinates.innerHTML =
        `Longitude: ${lngLat.lng}<br />Latitude: ${lngLat.lat}`;
});

marker2.on('dragend', () => {
    const lngLat = marker2.getLngLat();
    showme(coordinates);
    coordinates.innerHTML =
        `Longitude: ${lngLat.lng}<br />Latitude: ${lngLat.lat}`;
});

navigate_button.onclick = function() {
    hideme(searchui);
    showme(navigationui);
    showme(navigationoverview);
    hideme(navigationdirections);

    if (selecting_end_location) {
        marker2.setLngLat([geo[end_location_idx][0],geo[end_location_idx][1]]);
        end_location_name.innerHTML = item_name.innerHTML;
    } else {
        marker1.setLngLat([geo[start_location_idx][0],geo[start_location_idx][1]]);
        start_location_name.innerHTML = item_name.innerHTML;
    }
};

searchbox.addEventListener('focusin', () => {
    searchresults_wrapper.style.visibility = 'visible';
    if (searchbox.value.length === 0) {
        // recentsearches_div.innerHTML = '<button class="button">Example Search</button><button class="button">Another example search</button>';
        showme(othersearch);
    }

    
});

document.addEventListener("focusin", (event) => {
    const isClickInside = searchui.contains(event.target);
    if (!isClickInside) {
        searchresults_wrapper.style.visibility = 'hidden';
    }
});

select_start_location.onclick = function() {
    showme(searchui);
    hideme(navigationui);
    selecting_end_location = false;
    searchbox.value = '';
    searchresults.innerHTML = '';
};

select_end_location.onclick = function() {
    showme(searchui);
    hideme(navigationui);
    selecting_end_location = true;
    searchbox.value = '';
    searchresults.innerHTML = '';
};

begin_navigation.onclick = function() {
    reRoute();
    hideme(navigationoverview);
    showme(navigationdirections);
}

exit_navigation.onclick = function() {
    showme(searchui);
    hideme(navigationui);

    map.removeLayer('route');
    map.removeSource('route');

    searchbox.value = '';
    searchresults.innerHTML = '';
};

toggle_all_locations_button.onclick = function() {
    if (load_items_completed === false) {
        load_items();
        load_items_completed = true;
    }
    let is_hidden = all_locations.classList.toggle("hidden");

    if (!is_hidden) {
        hideme(show_all_locations_span);
        showme(hide_all_locations_span);
    } else {
        showme(show_all_locations_span);
        hideme(hide_all_locations_span);
    }
}

bookmark_checkbox.onclick = function() {
    if (bookmark_checkbox.checked) {
        bookmarks.add(selected_item_idx);
    } else {
        bookmarks.delete(selected_item_idx);
    }

    load_bookmarks();
}
