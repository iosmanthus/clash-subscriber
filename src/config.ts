import { GroupPolicy } from './policy';
import axios from 'axios';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
export class Config {
  public 'port'?: number;
  public 'socks-port'?: number;
  public 'redir-port'?: number;

  public 'mode'?: string;
  public 'log-level'?: string;

  public 'allow-lan'?: boolean;
  public 'policy'?: GroupPolicy;
  raw: any;

  constructor(config: string[], yml: any) {
    if (!yml['external-controller']) {
      throw 'Missing external-controller';
    }
    for (const i in config) {
      const [k, v] = config[i].split(/:|=/, 2);
      switch (k) {
        case 'port':
        case 'socks-port':
        case 'redir-port':
          const port = parseInt(v, 10);
          if (!port || port < 0 || port > 65535) {
            throw `Port out of range: ${port}.`;
          }
          this[k] = port;
          break;
        case 'log-level':
          if (
            v !== 'info' &&
            v !== 'warning' &&
            v !== 'error' &&
            v !== 'debug' &&
            v !== 'silent'
          ) {
            throw `Invalid log level: ${v}.`;
          }
          this[k] = v;
          break;
        case 'mode':
          if (v !== 'Rule' && v !== 'Direct' && v !== 'Global') {
            throw `Invalid mode: ${v}.`;
          }
          this[k] = v;
          break;
        case 'allow-lan':
          if (v !== 'true' && v !== 'false') {
            throw `Invalid allow-lan settings: ${v}.`;
          }
          this[k] = v === 'true';
          break;
        default:
          throw `Unknown key: '${k}'.`;
      }
    }
    this.raw = { ...yml, ...this };
  }

  public get proxies(): string[] {
    return this.raw['Proxy'].map(({ name }: any) => name);
  }

  public get workingMode(): string {
    return this.raw['mode'];
  }

  public get http_port(): number {
    return this.raw['port'];
  }

  public get controller(): string {
    return this.raw['external-controller'];
  }

  public filter(regex: RegExp) {
    this.raw['Proxy'] = this.raw['Proxy']?.filter((proxy: any) => {
      return (
        proxy['name']
          ?.match(regex)
          ?.values()
          .next().value.length > 0
      );
    });
  }

  public saveToPath(path: string) {
    fs.writeFileSync(path, yaml.safeDump(this.raw));
  }

  public async forceLoad(path: string) {
    await axios.put(`http://${this.controller}/configs?force=${true}`, {
      path,
    });
  }

  public registerGroupPolicy(policy: GroupPolicy) {
    if (!this.raw['Proxy'] || this.raw['Proxy'].length === 0) {
      return;
    }
    this.policy = policy;
    const group = policy.register(this);
    this.raw['Proxy Group'] = [group];
    this.raw['Rule'] = [`MATCH,${group.name}`];
  }

  public async applyGroupPolicy() {
    if (this.policy && this.policy.apply) {
      await this.policy.apply(this.raw['Proxy Group'][0], this);
    }
  }
}
