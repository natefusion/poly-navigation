const geo = JSON.parse(httpGet('/output.geojson'));

// if true, selecting start_location, if false then end_location
var selecting_end_location = true;
var selected_item_idx = undefined;

var start_location = undefined;
var end_location = undefined;
var start_at_geolocation = true;

var load_items_completed = false;

// A set, just indexes of geo
var bookmarks = new Set();

// An array, just indexes of geo
var recent_searches = new Array();
const max_recent_searches = 5;

let geolocation = undefined;
let geolocation_id = undefined;

function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

async function load_item_details(items_idx, searching = false) {
    selected_item_idx = items_idx;
    let item = geo[selected_item_idx];
    if (selecting_end_location) {
        end_location = [item[0],item[1]];
        little_map.jumpTo({center: end_location});
        little_map_marker.setLngLat(end_location);
    } else {
        start_location = [item[0],item[1]];
        little_map.jumpTo({center: start_location});
        little_map_marker.setLngLat(start_location);
    }
    item_name.innerHTML = item.name;

    bookmark_checkbox.checked = bookmarks.has(selected_item_idx);

    if (searching) {

        recent_searches = structuredClone(recent_searches.filter((x) => x !== selected_item_idx));
        recent_searches.unshift(selected_item_idx);

        if (recent_searches.length > max_recent_searches) {
            recent_searches.pop();
        }
        
     

	    load_recent_searches();
    }

    if (item.hasOwnProperty('folder') && item.hasOwnProperty('ref')) {
        item_image.src = `/images/${item.folder}/${item.ref}.jpg`
    }

    if (item.hasOwnProperty('tags')) {
        item_tags.innerHTML = `<p>${item.tags.toString()}</p>`
    }


}

function showme(el) {
    el.classList.toggle("hidden", false);
}

function hideme(el) {
    el.classList.toggle("hidden", true);
}

function load_items() {
    let list = '';
    for (const item in geo) {
        list += `<button onclick="load_item_details('${item}')" class="button button_search" popovertarget="item_details">${geo[item].name}</button>`
    }

    all_locations.innerHTML = list;
}

async function load_bookmarks() {
    try {
        const res = await fetch("https://34.133.14.10:8443/auth/bookmarks", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();
        const bookmarks = new Set(data.bookmarks || []);

        let list = '';
        for (const item of bookmarks) {
            list += `<button onclick="load_item_details('${item}')" class="button button_search" popovertarget="item_details">${geo[item].name}</button>`;
        }

        saved_locations.innerHTML = list;

        const is_hidden = saved_location_text.classList.contains("hidden");
        if (is_hidden) {
            showme(saved_location_text);
        } else {
            hideme(saved_location_text);
        }
    } catch (err) {
        console.error("Failed to load bookmarks:", err);
        saved_locations.innerHTML = '<p>Error loading bookmarks</p>';
    }
}


async function load_recent_searches() {
   let list = '';
    for (const item of recent_searches) {
        list += `<button onclick="load_item_details('${item}')" class="button button_search" popovertarget="item_details">${geo[item].name}</button>`
    }

    recentsearches_div.innerHTML = list;
}

function load_navigation_directions(navigation_directions) {
    let items = '<ol>';
    for (d of navigation_directions) {
        items += `<li>${d}</li>`;
    }
    items += '</ol>';
    
    navigationdirections.innerHTML = items ;
}
