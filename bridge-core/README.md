# Loki Bridge Core

This is some core code which is shared between `api` and `processing`.

### Installation

These instructions below are for the [binance chain javascript sdk](https://github.com/binance-chain/javascript-sdk).

> **Windows users:** Please install [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) first.

>**Mac users:** Make sure XCode Command Line Tools are installed: `xcode-select --install`.

>**Linux users:** You may need some dev packages to be installed on your system for USB support. On Debian-based distributions (like Ubuntu) you should install them with this command:
```bash
$ sudo apt-get install libudev-dev libusb-dev usbutils
```

### Testing

- Run `npm install`
- Edit config in `test/helpers/clients`
- Run `npm run test`
