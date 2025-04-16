#!/bin/sh

build.sh
sudo systemctl restart poly-navigation.service
npm run build
