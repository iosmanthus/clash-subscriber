export class Config {
  'port'?: number;
  'socks-port'?: number;
  'redir-port'?: number;

  'mode'?: string;
  'log-level'?: string;

  'allow-lan'?: boolean;
  raw: any;

  constructor(config: string[], yml: any) {
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

  public urlTestGroupOnly(url: string, interval: number) {
    if (!this.raw['Proxy'] || this.raw['Proxy'].length === 0) {
      return;
    }
    this.raw['Proxy Group'] = [
      {
        name: 'Auto',
        type: 'url-test',
        proxies: this.raw['Proxy']?.map((proxy: any) => {
          return proxy['name'];
        }),
        // tslint:disable-next-line: object-shorthand-properties-first
        url,
        // tslint:disable-next-line: object-shorthand-properties-first
        interval,
      },
    ];
    this.raw['Rule'] = ['MATCH,Auto'];
  }

  public dump(): any {
    return this.raw;
  }
}
