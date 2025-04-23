# Florida Poly navigation system
Shows various locations around Florida Poly and provides directions to get there.

# Dependencies to run the server on your computer
- [docker](https://docker.com/)
  - To run some required tools
- [osmium-tool](https://osmcode.org/osmium-tool/)
  - To convert .osm files to other useful formats
- [npm](https://www.npmjs.com/)
  - For javascript libraries
- [node.js](https://nodejs.org/en)
  - For external javascript code and npm
- [python3](https://python.org)
  - For the account server
- [certbot (optional)](https://certbot.eff.org/)
  - For https cetification
  
# Development setup
## Initial setup
- `cd poly-navigation`
- `npm install .`
- `python3 -m venv venv`
- `./venv/bin/pip install flask flask-cors`

## Build and run
- `./build.sh` or `./build.bat` to create all the necessary files to start the server. This only needs to be run after a change to polycampus.osm
- `./run.sh` or `./run.bat`

# Production setup
## Initial setup
- `cd poly-navigation`
- `npm install .`
- `python3 -m venv venv`
- `./venv/bin/pip install flask flask-cors`
- `cp ./config/poly-navigation.service /etc/systemd/system/`
  - You will need to change the `ExecStart` line to the file path for `./config/start-poly-navigation.sh`
- `sudo systemctl daemon-reload && sudo systemctl enable poly-navigation.service`
- `cp ./config/ncp.conf /etc/nginx/sites-available/ncp.conf`
  - Remove the lines created by Certbot (labeled "managed by Cerbot")
  - Change `server_name` to your domain
  - Change `root` to `<location-of-this-repository>/dist`
- `sudo systemctl enable nginx`
- `sudo certbot --nginx` (optional)
  - `sudo systemctl restart nginx` to apply the changes Certbot made


## Build and deploy
- `./server-run.sh`

# File Tree
- `osm`
  - `filter-search-queries.js`
    - Filters through raw point-of-interest data from `polycampus.osm` for use with our fuzzy-searching library.
  - `foot.lua`
    - Configuration for OSRM-Backend.
    - Provided by OSRM-Backend.
  - `polycampus.osm`
    - Map data for Florida Poly.
  - `tilemaker-config.lua`
    - Configuration for Tilermaker. Specifies options for different map layers and other general options.
    - Provided by Tilemaker.
  - `tilemaker-process.lua`
    - Configuration for Tilemaker. Specifies which data should be included in the vector map data.
    - Provided by Tilemaker.
- `public`
  - `functions.js`
    - Additional source code for the UI. Assists `script.js` with functions that need to be available in the global scope.
  - `images`
    - Holds point-of-interest images.
- `tileserver-data`
  - Configuration for TileServer GL. Holds map style information.
- `app.py`
  - Source code for our Account System. Handles user data, log in, and sign up.
- `index.html`
  - Website layout.
- `script.js`
  - Source code for UI. The glue thats holds this website together.
- `style.css`
  - UI style.
