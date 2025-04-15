import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import OSRMTextInstructions from 'osrm-text-instructions';
const text_instructions = new OSRMTextInstructions('v5');

import Fuse from 'fuse.js';

// import '/functions.js';

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
		"addr:unit",
        "tags"
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
        let list = '';
        for (const item of items) {
            list += `<button onclick="load_item_details('${item.refIndex}', true)" class="button" popovertarget="item_details">${item.item.name}</button>`
        }

        searchresults.innerHTML = list;
    } else {
        searchresults.innerHTML = '';
    }
});

function transform_request(url, resourceType) {
    if (url.startsWith(`http://${window.location.hostname}/`) && !url.includes('/tiles/')) {
        return {
            url: url.replace(`http://${window.location.hostname}/`, `https://${window.location.hostname}/tiles/`)
        };
    }
    return { url: url };
}

// Initialize the map
const map = new maplibregl.Map({
    container: 'map', // ID of the div where the map will be rendered
    style: '/tiles/styles/osm-real/style.json',
    // very LAME
    transformRequest: transform_request,
    center: [-81.848914, 28.148263], // Longitude, Latitude
    zoom: 17 // Zoom level
});

const little_map = new maplibregl.Map({
    container: 'item_map',
    style: '/tiles/styles/osm-real/style.json',
    zoom: 19
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

const marker1 = new maplibregl.Marker({draggable: true, color: '#FF0000'});
const marker2 = new maplibregl.Marker({draggable: false});

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

function geolocation_error(err) {
  console.error(`ERROR(${err.code}): ${err.message}`);
}

navigate_button.onclick = function() {
    hideme(searchui);
    showme(navigationui);
    showme(navigationoverview);
    hideme(navigationdirections);

    if (selecting_end_location) {
        marker2.setLngLat(end_location).addTo(map);
        end_location_name.innerHTML = item_name.innerHTML;
    } else {
        start_at_geolocation = false;
        marker1.setLngLat(start_location);
        start_location_name.innerHTML = item_name.innerHTML;
    }
};

searchbox.addEventListener('focusin', () => {
    searchresults_wrapper.style.visibility = 'visible';
    if (searchbox.value.length === 0) {
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
    if (start_at_geolocation) {
        geolocation_id = navigator.geolocation.watchPosition(
            (pos) => {
                geolocation = pos.coords;
                start_location = [geolocation.longitude, geolocation.latitude];
                marker1.setLngLat(start_location);
                reRoute();
            },
            geolocation_error,
            {
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 30000
            }
        );
    } else {
        reRoute();
    }

    hideme(navigationoverview);
    showme(navigationdirections);
}

exit_navigation.onclick = function() {
    showme(searchui);
    hideme(navigationui);

    map.removeLayer('route');
    map.removeSource('route');

    marker2.remove();

    searchbox.value = '';
    searchresults.innerHTML = '';

    if (geolocation_id === undefined) {
        console.log("geolocation_id is undefined, what the heck.");
    } else {
        navigator.geolocation.clearWatch(geolocation_id);
    }

    selecting_end_location = true;
    start_at_geolocation = true;
    geolocation_id = undefined;
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

update_location.onclick = function() {
    update_location.disabled = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            geolocation = pos.coords;
            marker1.setLngLat([geolocation.longitude, geolocation.latitude]);
            console.log(`Current position: ${geolocation.longitude},${geolocation.latitude}`);
            update_location.disabled = false;
        },
        geolocation_error,
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 30000
        }
    );
}

update_location_before_navigation.onclick = function() {
    update_location_before_navigation.disabled = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            geolocation = pos.coords;
            marker1.setLngLat([geolocation.longitude, geolocation.latitude]);
            console.log(`Current position: ${geolocation.longitude},${geolocation.latitude}`);
            update_location_before_navigation.disabled = false;
        },
        geolocation_error,
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 30000
        }
    );
}

navigator.permissions.query({name:'geolocation'}).then(function(result) {
    if (result.state == 'prompt' || result.state == 'granted') {
        console.log("Getting geolocation permission ...");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                geolocation = pos.coords;
                marker1.setLngLat([geolocation.longitude, geolocation.latitude]).addTo(map);
                console.log(`Current position: ${geolocation.longitude},${geolocation.latitude}`);
            },
            geolocation_error,
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 30000
            }
        );
    } else if (result.state == 'denied') {
        console.log("Did not get geolocation permission ...");
    }
});
