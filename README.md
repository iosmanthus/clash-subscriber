# Clash Subscriber

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@iosmanthus/clash-subscriber)](https://npmjs.org/package/iosmanthus/clash-subscriber)
[![Download](https://img.shields.io/npm/dw/@iosmanthus/clash-subscriber)](https://www.npmjs.com/package/@iosmanthus/clash-subscriber)
[![License](https://img.shields.io/npm/l/@iosmanthus/clash-subscriber)](https://github.com/iosmanthus/clash-subscriber/blob/master/package.json)

## Installation

```sh
npm install -g @iosmanthus/clash-subscriber
```

## Usage

```sh
USAGE
  $ clash-subscriber [options] -l/--url URL

OPTIONS
  -A, --url-test-group-only      strip out all rules and proxy groups except for a url-test group via a url
  -c, --config=config            extra configurations for Clash, e.g. port=1081 socks-port=1080 allow-lan:false
  -f, --file=file                [default: /etc/clash/config.yaml] file to save the configuration
  -h, --help                     show CLI help
  -i, --interval=interval        [default: 60] interval to fetch configuration, in minutes
  -l, --url=url                  (required) subscription link
  -t, --controller=controller    [default: http://localhost:9090]
  -v, --version                  show CLI version
  --test-interval=test-interval  [default: 600] test interval, valid only while flag `url-test-group-only` is set, in seconds
  --test-url=test-url            [default: http://www.gstatic.com/generate_204] test url, valid only while flag `url-test-only` is set
```
