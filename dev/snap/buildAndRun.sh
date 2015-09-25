#!/bin/sh
zip -r app.nw *
mv app.nw /tmp
~/nw/nw /tmp/app.nw
