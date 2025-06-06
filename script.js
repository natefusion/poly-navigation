import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import OSRMTextInstructions from 'osrm-text-instructions';
const text_instructions = new OSRMTextInstructions('v5');

import Fuse from 'fuse.js';

import './public/functions.js';

fetch('/commit.txt').then((req) => req.text()).then((id) => document.getElementById("commit_id").innerHTML = id);

const poly_center = [-81.848914, 28.148263];

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
        "ref",
        "folder",
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
            list += `<button onclick="load_item_details('${item.refIndex}', true)" class="button button_search" popovertarget="item_details">${item.item.name}</button>`
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
    center: poly_center, // Longitude, Latitude
    zoom: 17 // Zoom level
});

window.little_map = new maplibregl.Map({
    container: 'item_map',
    style: '/tiles/styles/osm-real/style.json',
    transformRequest: transform_request,
    interactive: false,
    zoom: 19
});
window.little_map_marker = new maplibregl.Marker({draggable: false}).setLngLat([0,0]).addTo(window.little_map);

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

const marker1 = new maplibregl.Marker({draggable: false, color: '#FF0000'});
const marker2 = new maplibregl.Marker({draggable: false});

function marker1_drag_callback() {
    turn_off_geolocation_ui();
    reRoute()
}

function reRoute() {
    const src = marker1.getLngLat();
    const dst = marker2.getLngLat();

    const str = `/osrm/route/v1/foot/${src.lng},${src.lat};${dst.lng},${dst.lat}?geometries=geojson&steps=true&overview=full`;
    const route = httpGet(str);
    const json_route = JSON.parse(route);

    if (json_route.code !== "Ok") {
        console.log(json_route.message);
        return;
    }

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

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function geolocation_callback(pos) {
    start_at_geolocation = true;
    geolocation = pos.coords;
    marker1.setLngLat([geolocation.longitude, geolocation.latitude]).addTo(map);
    map.flyTo({center: [geolocation.longitude, geolocation.latitude]});
    
    showme(tracking_current_geolocation);
    hideme(not_tracking_current_geolocation);
    hideme(geolocation_loader_container);
    showme(geolocation_tracking_message_container);
    
    console.log(`Current position: ${geolocation.longitude},${geolocation.latitude}`);
}

function turn_off_geolocation_ui() {
    start_at_geolocation = false;
    hideme(tracking_current_geolocation);
    showme(not_tracking_current_geolocation);
    hideme(geolocation_loader_container);
    showme(geolocation_tracking_message_container);
}

function geolocation_error(err, location) {
    console.error(`ERROR(${err.code}): ${err.message}`);
    marker1.setLngLat(location).addTo(map);
    map.flyTo({center: location, zoom: 17})
    document.getElementById("geolocation_error_popover").togglePopover();
    turn_off_geolocation_ui();
}

navigate_button.onclick = function() {
    hideme(searchui);
    showme(navigationui);
    showme(navigationoverview);
    hideme(navigationdirections_container);

    if (selecting_end_location) {
        marker2.setLngLat(end_location).addTo(map);
        end_location_name_final.innerHTML = item_name.innerHTML;
        hideme(end_location_name_initial);
        showme(end_location_name_final);
    } else {
        marker1.setLngLat(start_location);
        start_location_name_final.innerHTML = item_name.innerHTML;
        hideme(start_location_name_initial);
        showme(start_location_name_final);
        hideme(cancel_select_start_or_end_location);
        turn_off_geolocation_ui();
    }

    marker1.setDraggable(true);
    marker1.on('dragend', marker1_drag_callback);

    reRoute();
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

function set_bearing(event) {
    map.setBearing(-event.alpha, {center: marker1.getLngLat()});
}

function dont_get_bearing_from_device() {
    window.removeEventListener('deviceorientationabsolute', set_bearing);
    recenter_map.toggleAttribute('disabled', false);
}

function do_get_bearing_from_device() {
    map.flyTo({center: marker1.getLngLat(), zoom: 17});
    map.once('moveend', () => window.addEventListener('deviceorientationabsolute', set_bearing));
    recenter_map.toggleAttribute('disabled', true);
}

select_start_location.onclick = function() {
    showme(searchui);
    hideme(navigationui);
    selecting_end_location = false;
    searchbox.value = '';
    searchresults.innerHTML = '';
    marker1.setDraggable(false);
    hideme(update_location);
    showme(cancel_select_start_or_end_location);
};

cancel_select_start_or_end_location.onclick = function() {
    hideme(searchui);
    showme(navigationui);
    selecting_end_location = true;
    marker1.setDraggable(true);
    showme(update_location);
    hideme(cancel_select_start_or_end_location);
}

select_end_location.onclick = function() {
    showme(searchui);
    hideme(navigationui);
    selecting_end_location = true;
    marker1.setDraggable(false);
    searchbox.value = '';
    searchresults.innerHTML = '';

    hideme(update_location);
    showme(cancel_select_start_or_end_location);
};

begin_navigation.onclick = function() {
    marker1.setDraggable(false);
    do_get_bearing_from_device();
    recenter_map.addEventListener('click', do_get_bearing_from_device);
    map.on('dragstart', dont_get_bearing_from_device);
    map.on('touchstart', dont_get_bearing_from_device);
    
    if (start_at_geolocation) {
        showme(geolocation_loader_container);
        hideme(geolocation_tracking_message_container);
        console.log("Starting at geolocation ...");
        
        geolocation_id = navigator.geolocation.watchPosition(
            (pos) => {
                hideme(geolocation_loader_container);
                showme(geolocation_tracking_message_container);
                console.log("Geolocation reacquired");
                geolocation = pos.coords;
                marker1.setLngLat([geolocation.longitude, geolocation.latitude]);
            },
            (err) => console.error(`ERROR(${err.code}): ${err.message}`),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 30000
            }
        );
    } else {
        console.log("Starting at red pin or selected location");
        reRoute();
    }

    hideme(navigationoverview);
    showme(navigationdirections_container);
}

function stop_navigation() {
    showme(searchui);
    showme(update_location);
    hideme(navigationui);

    if (map.getLayer('route') !== undefined) {
        map.removeLayer('route');
        map.removeSource('route');
    }

    marker2.remove();
    marker1.setDraggable(true);

    searchbox.value = '';
    searchresults.innerHTML = '';

    if (geolocation_id === undefined) {
        if (start_at_geolocation) {
            console.log("geolocation_id is undefined, what the heck.");
        }
    } else {
        navigator.geolocation.clearWatch(geolocation_id);
    }

    map.off('dragstart', dont_get_bearing_from_device);
    map.off('touchstart', dont_get_bearing_from_device);
    recenter_map.removeEventListener('click', do_get_bearing_from_device);
    window.removeEventListener('deviceorientationabsolute', set_bearing);

    selecting_end_location = true;    
    geolocation_id = undefined;
    start_location = undefined;
    end_location = undefined;
    selected_item_idx = undefined;
    
    showme(end_location_name_initial);
    showme(start_location_name_initial);
    hideme(end_location_name_final);
    hideme(start_location_name_final);

    marker1.setDraggable(false);
    marker1.off('dragend', marker1_drag_callback);
}

exit_navigation_in_directions.onclick = stop_navigation;
exit_navigation_in_overview.onclick = stop_navigation;

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

function load_recent_searches_from_server() {
    if (logged_in) {
        fetch("/auth/recent_searches", {
            method: "GET",
            credentials: "include"
        }).then((res) => res.json()).then((data) => {
            recent_searches = structuredClone(data.recent_searches);
            for (let i in recent_searches) {
                recent_searches[i] = parseInt(recent_searches[i]);
            }

            load_recent_searches();
        });
    }
}

function load_bookmarks_from_server() {
    if (logged_in) {
        fetch("/auth/bookmarks", {
            method: "GET",
            credentials: "include"
        }).then((res) => res.json()).then((data) => {
            bookmarks = new Set();
            for (let item of data.bookmarks) {
                bookmarks.add(parseInt(item));
            }
            
            load_bookmarks();
        });
    }
}

bookmark_checkbox.onclick = function() {
    if (bookmark_checkbox.checked) {
        bookmarks.add(selected_item_idx);
    } else {
        bookmarks.delete(selected_item_idx);
    }

    load_bookmarks();
    saveBookmarksToServer();
}


async function saveBookmarksToServer() {
    if (!logged_in) {
        return;
    }
    const bookmarkArray = Array.from(bookmarks);
    const params = new URLSearchParams();
    params.append('bookmarks', JSON.stringify(bookmarkArray));
	
    try {
	    const res = await fetch(`/auth/bookmarks?${params.toString()}`, {
		    method: 'POST',
		    credentials: 'include',
	    });
        if (!res.ok) {
            const errData = await res.json();
            console.error('Failed to save bookmarks:', errData.error);
        }
    } catch (err) {
        console.error('Network error saving bookmarks:', err);
    }
}

update_location.onclick = function() {
    showme(geolocation_loader_container);
    hideme(geolocation_tracking_message_container);
    navigator.geolocation.getCurrentPosition(
        geolocation_callback,
        (err) => geolocation_error(err, poly_center),
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 30000
        }
    );
};

update_location_before_navigation.onclick = function() {
    showme(geolocation_loader_container);
    hideme(geolocation_tracking_message_container);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            geolocation_callback(pos);
            reRoute(); // important difference to update_location.onclick
        },
        (err) => geolocation_error(err, marker1.getLngLat()),
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 30000
        }
    );
    showme(start_location_name_initial);
    hideme(start_location_name_final);
}

navigator.permissions.query({name:'geolocation'}).then(function(result) {
    showme(geolocation_loader_container);
    hideme(geolocation_tracking_message_container);
    if (result.state == 'prompt' || result.state == 'granted') {
        console.log("Getting geolocation permission ...");
        navigator.geolocation.getCurrentPosition(
            geolocation_callback,
            (err) => geolocation_error(err, poly_center),
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

// Reveal-Drawer functionality for the navigation part
let isDragging = false;
let initialHeight;
let startY;
let newHeight;

const drawer = document.getElementById("navigationoverview");
const drawerHandle = document.getElementById("navigationoverview");

// Only for smaller screens like smartphones
if (window.innerWidth <= 1000) {
    drawerHandle.addEventListener("touchstart", function (e) {
        if (e.touches.length === 1) {
            isDragging = true;
            initialHeight = drawer.offsetHeight;
            startY = e.touches[0].clientY;
            document.body.style.cursor = "row-resize";
        }
    }, { passive: false });
    
    document.addEventListener("touchmove", function (e) {
        if (isDragging) {
            e.preventDefault();
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            newHeight = initialHeight + deltaY;
            
            // Limit the drawer to 500px 
            newHeight = Math.max(50, Math.min(500, newHeight));
            
            drawer.style.height = `${newHeight}px`;
        }
    }, { passive: false });
    
    document.addEventListener("touchend", function () {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = "default";
        }
    });
}

// captcha generation
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

let currentCaptcha = generateCaptcha();

function updateCaptcha() {
    currentCaptcha = generateCaptcha();
    document.getElementById('captcha-text').textContent = currentCaptcha;
}

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string
    return hashHex;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCaptcha();

    if (getCookie("username") !== "" && getCookie("password") !== "") {
        fetch('/auth/login', {
            method: "POST",
            credentials: "include"
        }).then((req) => {
            if (req.ok) {
                account_information_text.innerHTML = getCookie("username")
                console.log("Logged in");
                logged_in = true;
                
                load_bookmarks_from_server();
	            load_recent_searches_from_server();
                hideme(signup_button);
                hideme(login_button);
                showme(logout_button);
            } else {
                showme(signup_button);
                showme(login_button);
                hideme(logout_button);
                console.log("Could Not Login")
            }
        });
    }

    confirm_button_login.onclick = async  function() {
        const captchaInput = document.getElementById('captcha-input').value;
        if (captchaInput.toLowerCase() !== currentCaptcha.toLowerCase()) {
            alert('Incorrect captcha code');
            updateCaptcha();
            return;
        }
 	    const username = document.getElementById("input_username_login").value;
        const password = await digestMessage(document.getElementById("input_password_login").value);

        account_information_text.innerHTML = "None";
	    
	    if (!username || !password) {
            alert("Please enter both username and password.");
            return;
        }

        try {
            const res = await fetch(`/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok) {
                account_information_text.innerHTML = username
                alert("Login successful");
                logged_in = true;
                hideme(signup_button);
                hideme(login_button);
                showme(logout_button);
                load_bookmarks_from_server();
	            load_recent_searches_from_server();
            } else {
                showme(signup_button);
                showme(login_button);
                hideme(logout_button);
                alert("Login failed: " + data.error);
	            return;
            }
        } catch (err) {
            console.error("Network error:", err);
            alert("Failed to connect to the server");
        }
        input_password_login.value = "";
        input_username_login.value = "";
	    login_popup.hidePopover();
	    const usertag = document.getElementById('account_information_text');
	    usertag.textContent = username;
    };
    
    confirm_button_signup.onclick = async function() {
        const username = document.getElementById("input_username_signup").value;
        const password = document.getElementById("input_password_signup").value;
        const confirmpassword = document.getElementById('confirm_password_signup').value;

        account_information_text.innerHTML = "None";

        if (password !== confirmpassword) {
            alert('Passwords do not match');
            return;
        }
	    if(password.length<10) {
            alert('Password length is less than 10 characters');
            return;
        }
        try {
            const password_hash = await digestMessage(password);
            const res = await fetch(`/auth/signup?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password_hash)}`, {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                alert('Sign-up successful');
                signup_popup.hidePopover();
                account_information_text.innerHTML = username;
                logged_in = true;
                load_bookmarks_from_server();
	            load_recent_searches_from_server();
                hideme(signup_button);
                hideme(login_button);
                showme(logout_button);
            } else {
                showme(signup_button);
                showme(login_button);
                hideme(logout_button);
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Request failed', err);
            alert('Network error');
        }

        input_password_signup.value = "";
        input_username_signup.value = "";
        confirm_password_signup.value = "";
    };
});
const logout_button = document.getElementById('logout_button');

logout_button.onclick = async  function () {
	await fetch("/auth/logout", {
        method: "POST",
        credentials: "include"
    });
};

actually_logout.onclick = function() {
    showme(signup_button);
    showme(login_button);
    hideme(logout_button);
    logged_in = false;
    document.cookie = '';
    bookmarks = new Set();
    recent_searches = new Array();
	const usertag = document.getElementById('account_information_text');
	usertag.textContent = "None";
}
