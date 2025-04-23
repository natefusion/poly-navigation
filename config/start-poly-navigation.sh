#!/bin/sh

cd /home/nthnpiel/poly-navigation
docker-compose up &
python3 app.py &

wait
