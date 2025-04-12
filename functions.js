const geo = JSON.parse(httpGet('http://localhost:5173/osm/output.geojson'));

// if true, selecting start_location, if false then end_location
var selecting_end_location = true
var selected_item_idx = -1

var start_location_idx = -1
var end_location_idx = -1

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

searchui.addEventListener('focusin', () => {
    searchresults_wrapper.style.visibility = 'visible';
});

document.addEventListener("focusin", (event) => {
    const isClickInside = searchui.contains(event.target);
    if (!isClickInside) {
        searchresults_wrapper.style.visibility = 'hidden';
    }
});

select_start_location.addEventListener("click", () => {
    searchui.style.display = 'flex';
    navigationui.style.display = 'none';
    selecting_end_location = false;
    searchbox.value = '';
    searchresults.innerHTML = '';
});

select_end_location.addEventListener("click", () => {
    searchui.style.display = 'flex';
    navigationui.style.display = 'none';
    selecting_end_location = true;
    searchbox.value = '';
    searchresults.innerHTML = '';
});

