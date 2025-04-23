#!/bin/sh

docker compose up &
./venv/bin/python3 app.py &
npm run dev &

wait
