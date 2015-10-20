#!/bin/sh
rm -R node_modules
npm install serialport
cd node_modules/serialport
node-pre-gyp rebuild --runtime=node-webkit --target="0.12.3"
cd ../..
