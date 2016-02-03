## Experimental releases

Please note you need to download and install drivers for Win32 and MacOSX versions. The GNU/Linux version doesn't need any drivers, as usual ;)

[GNU/Linux 64b](http://vps34736.ovh.net/whitecat/WhiteCat-gnu64.zip)

[GNU/Linux 32b](http://vps34736.ovh.net/whitecat/WhiteCat-gnu32.zip)

[Win32](http://vps34736.ovh.net/whitecat/WhiteCat-win32.zip) - [Drivers](https://www.silabs.com/Support%20Documents/Software/CP210x_VCP_Windows.zip)

[OSX](http://vps34736.ovh.net/whitecat/WhiteCat-osx.zip) - [Drivers](https://www.silabs.com/Support%20Documents/Software/Mac_OSX_VCP_Driver.zip)

---

_Latest release: **03/02/2016**_

---

The WhiteCat packager is not included in this repository because it contains lots of binaries, which would increase its size way too much.

The packager, including all binaries and builder scripts, can be found [here](http://vps34736.ovh.net/whitecat/WhiteCat-builder.tar.gz), while the _nwjs_ source and binaries can be found [here](https://github.com/nwjs/nw.js).

The packager includes the following scripts:

* **update.sh** → Updates the packager to the latest WhiteCat version available in this repository
* **build-gnu32.sh** → Builds the GNU/Linux 32b package based on the WhiteCat version in the packager
* **build-gnu64.sh** → Builds the GNU/Linux 64b package based on the WhiteCat version in the packager
* **build-osx.sh** → Builds the MacOSX package based on the WhiteCat version in the packager
* **build-win32.sh** → Builds the Microsoft Windows package based on the WhiteCat version in the packager
* **update-build-all.sh** → Updates the packager to the latest WhiteCat version available in this repository and builds packages for all platforms. Additionally, it copies these ready-to-download packages into _/var/www/whitecat_, which should exist.

The Microsoft Windows packaging script depends on [Inno Setup](http://www.jrsoftware.org/isinfo.php), ran headless by Wine.
