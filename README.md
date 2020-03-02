# Clash Subscriber

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@iosmanthus/clash-subscriber)](https://npmjs.org/package/iosmanthus/clash-subscriber)
[![License](https://img.shields.io/npm/l/@iosmanthus/clash-subscriber)](https://github.com/iosmanthus/clash-subscriber/blob/master/package.json)

## Installation

```sh
npm install -g @iosmanthus/clash-subscriber
```

## Usage

```sh
clash-subscriber [options] URL
clash-subscriber --help
USAGE
  $ clash-subscriber URL

OPTIONS
  -h, --help                   show CLI help
  -i, --interval=interval      [default: 60] Interval to fetch configuration, in minutes
  -p, --path=path              [default: /etc/clash/config.yaml]
  -t, --controller=controller  [default: http://localhost:9090]
  -c, --config=config          Config the slash, e.g. -c=port:1081,socks-port:1080
  -v, --version                show CLI version
```
