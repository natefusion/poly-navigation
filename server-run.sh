#!/bin/sh

npm run build
docker-compose up &

wait
