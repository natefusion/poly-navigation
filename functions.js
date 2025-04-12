const geo = JSON.parse(httpGet('http://localhost:5173/osm/output.geojson'));

// if true, selecting start_location, if false then end_location
var selecting_end_location = true;
var selected_item_idx = -1;

var start_location_idx = -1;
var end_location_idx = -1;

var load_items_completed = false;

function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function load_item_details(items_idx) {
    selected_item_idx = items_idx;
    if (selecting_end_location) {
        end_location_idx = items_idx;
    } else {
        start_location_idx = items_idx;
    }
    item_name.innerHTML = geo[items_idx].name;
}

function showme(el) {
    el.classList.toggle("hidden", false);
}

function hideme(el) {
    el.classList.toggle("hidden", true);
}

function load_items() {
    list = '';
    for (const item in geo) {
        list += `<button onclick="load_item_details('${item}')" class="button" popovertarget="item_details">${geo[item].name}</button>`
    }

    all_locations.innerHTML = list;
}
