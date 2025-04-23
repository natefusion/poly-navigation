#!/bin/sh

cd /home/nthnpiel/poly-navigation
docker-compose up &
./venv/bin/python3 app.py &

wait
