const fs = require('node:fs');

const data = fs.readFileSync('./polycampus.geojson', 'utf8');

const geoJSONcontent = JSON.parse(data);
const features = geoJSONcontent["features"]
const output = features.filter((function (item) {
    const props = item["properties"];
    return (props !== null && "polynav" in props);
}));

console.log(JSON.stringify(output));

