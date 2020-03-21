# Clash Subscriber

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@iosmanthus/clash-subscriber)](https://npmjs.org/package/@iosmanthus/clash-subscriber)
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
  -G, --group-policy=group-policy  apply a group policy to proxies, retain only one proxy group and match rule
  -c, --config=config              extra configurations for Clash, e.g. port=1081 socks-port=1080 allow-lan=true
                                   external-controller=172.18.0.2:9090

  -f, --file=file                  [default: /etc/clash/config.yaml] file to save the configuration
  -h, --help                       show CLI help
  -i, --interval=interval          [default: 60] interval to fetch configuration, in minutes
  -l, --url=url                    (required) subscription link
  -p, --virtual-path=virtual-path  virtual file path to load the configuration. useful in docker. default value as same as the `file`
  -r, --filter=filter              use a regex to filter proxy
  -v, --version                    show CLI version
```

For flag `group-policy`, there are two options for it:

1. `method=speed`, this option will test the download speed toward the `url=`. You can also specify a `timeout=` (default: `10s`) to limit the download time. If there is no proxy selected, `timeout` will amplify to the 1.5x of itself and try again.
2. `method=latency`, this option will test the latency toward the `url=` which is done by `Clash` itself. You can provide an `interval` value to it (default: `10min`).

Flag `virtual-path` is for refresh config for Clash on docker. (Make sure your initial controller is correct)
