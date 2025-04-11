const fs = require('node:fs');

const data = fs.readFileSync('./polycampus.geojson', 'utf8');

const geoJSONcontent = JSON.parse(data);
const features = geoJSONcontent["features"]
const with_polynav = features.filter((function (item) {
    const props = item["properties"];
    return (props !== null && "polynav" in props);
}));

function removeDuplicates(data) {
    const sorted = data.sort((function (a, b) {
        return a["name"].localeCompare(b["name"]);
    }));

    let previous_name = "";
    let without_dups = [];
    for (item of sorted) {
        const current_name = item["name"];
        if (current_name.localeCompare(previous_name) !== 0) {
            without_dups.push(item);
        }
        previous_name = current_name;
    }

    return without_dups;
}

const output = removeDuplicates(with_polynav.map((x) => x["properties"]))

console.log(JSON.stringify(output));

