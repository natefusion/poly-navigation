#!/bin/sh

docker compose up &
npm run dev &

wait
