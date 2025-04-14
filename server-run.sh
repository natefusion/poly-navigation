#!/bin/sh

cp functions.js public/

npm run build
docker-compose up &

wait
