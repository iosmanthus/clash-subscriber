import { Config } from './config';
import axios from 'axios';
import * as pTime from 'p-time';
import * as pTimeout from 'p-timeout';
import * as log from 'loglevel';

export class GroupPolicy {
  public method?: 'latency' | 'speed';
  public url: string = 'http://www.gstatic.com/generate_204';
  public interval: number = 600;
  public timeout: number = 10000;

  public apply?: (group: ProxyGroup, config: Config) => Promise<void>;

  constructor(config: string[]) {
    if (config.length === 0) {
      throw 'Empty group policy';
    }
    for (const i in config) {
      const [k, v] = config[i].split(/=/, 2);
      switch (k) {
        case 'method':
          if (v !== 'latency' && v !== 'speed') {
            throw `Unknown method: ${v}`;
          }
          this.method = v;
          break;
        case 'url':
          this.url = v;
          break;
        case 'interval':
        case 'timeout':
          const value = parseInt(v, 10);
          if (!value) {
            throw `invalid value: ${v} for ${k}`;
          }
          this[k] = value;
          break;
      }
    }
    if (!this.method) {
      throw 'Missing method';
    }
  }

  async switchMode(controller: string, mode: string) {
    await axios.patch(`http://${controller}/configs`, { mode }).catch(() => {
      throw `Fail to switch to mode: ${mode}`;
    });
  }

  async selectProxy(controller: string, selector: string, name: string) {
    await axios
      .put(`http://${controller}/proxies/${selector}`, { name })
      .catch(() => {
        throw `Fail to select proxy: ${selector}/${name} via ${controller}`;
      });
  }

  async testSpeed(port: number): Promise<number> {
    const download = pTime(async () => {
      await pTimeout(
        axios({
          method: 'get',
          url: this.url,
          responseType: 'arraybuffer',
          proxy: { port, host: '127.0.0.1' },
        }),
        this.timeout,
      );
    })();

    try {
      await download;
      return download.time || Infinity;
    } catch (err) {
      throw err;
    }
  }

  async applySpeedPolicy(group: ProxyGroup, config: Config) {
    const { controller } = config;
    log.info('Switching to Global mode.');

    await this.switchMode(controller, 'Global');
    const proxies = config.proxies;
    let min: any = undefined;
    for (const i in proxies) {
      try {
        await this.selectProxy(controller, 'GLOBAL', proxies[i]);
        const time = await this.testSpeed(config.http_port);
        log.info(`${proxies[i]}'s latency: ${time} ms.`);
        if (!min || min.time > time) {
          min = { time, name: proxies[i] };
        }
      } catch (err) {
        log.warn(`Fail to test ${proxies[i]}. reason: ${err}.`);
      }
    }
    if (!min) {
      log.error('No proxy selected!');
      this.timeout *= 1.5;
      log.warn(`Try to amplify timeout to ${this.timeout}.`);
      await this.applySpeedPolicy(group, config);
    } else {
      try {
        await this.selectProxy(controller, group.name, min.name);
        await this.switchMode(controller, 'Rule');
        log.info(`Successfully select proxy: ${group.name}/${min.name}.`);
      } catch (err) {
        log.error(
          `Fail to apply proxy ${group.name}/${min.name}; resone: ${err}.`,
        );
      }
    }
  }

  public async applyLatencyPolicy(group: ProxyGroup, config: Config) {
    log.info(`Successfully select ${group.name} in mode: ${config.workingMode}.`);
  }

  public register(config: Config): ProxyGroup {
    const group: any = {};

    group.name = 'Generated';
    group.proxies = config.proxies;
    switch (this.method) {
      case 'latency':
        group.type = 'url-test';
        group.url = this.url;
        group.interval = this.interval;
        this.apply = this.applyLatencyPolicy;
        break;
      case 'speed':
        group.type = 'select';
        this.apply = this.applySpeedPolicy;
        break;
    }
    return group;
  }
}

export interface ProxyGroup {
  name: string;
  type: string;
  proxies: string[];
  url?: string;
  interval?: number;
}
