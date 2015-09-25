#!/bin/sh
zip -r app.nw *
mv app.nw ../nw
cd ../nw
./nw app.nw
cd ../snap
