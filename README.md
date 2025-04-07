# Florida Poly navigation system
Shows various locations around Florida Poly and provides directions to get there.

# Dependencies to run the server on your computer
- [docker](https://docker.com/)
  - to run the programs that are too hard to install
- [osmium-tool](https://osmcode.org/osmium-tool/)
  - to convert .osm files to other useful formats
- [npm](https://www.npmjs.com/)
  - for javascript libraries
- [node.js](https://nodejs.org/en)
  - for one three line script
  
# How to run the server
## Initial setup after first downloading this repository
`npm install .`

## To create all the necessary files to do the thing. This should be run after every change to polycampus.osm
`./build.sh`

## To start the server
`./run.sh`
