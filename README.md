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
  - For external javascript code and npm
- [certbot (optional)](https://certbot.eff.org/)
  - For https cetification
  
# Development setup
## Initial setup
- `cd poly-navigation`
- `npm install .`
- `python3 -m venv venv`
- `.\venv\bin\pip install flask flask-cors`

## Build and run
- `./build.sh` or `./build.bat` to create all the necessary files to start the server. This only needs to be run after a change to polycampus.osm
- `./run.sh` or `./run.bat`

# Production setup
## Initial setup
- `cd poly-navigation`
- `npm install .`
- `python3 -m venv venv`
- `.\venv\bin\pip install flask flask-cors`
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
