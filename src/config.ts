export class Config {
  'port'?: number;
  'socks-port'?: number;
  'redir-port'?: number;

  'mode'?: string;
  'log-level'?: string;

  'allow-lan'?: boolean;

  constructor(config: string[]) {
    for (const i in config) {
      const [k, v] = config[i].split(/:|=/, 2);
      switch (k) {
        case 'port':
        case 'socks-port':
        case 'redir-port':
          const port = parseInt(v, 10);
          if (port < 0 || port > 65535) {
            throw `Port out of range: ${port}`;
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
            throw `Invalid log level: ${v}`;
          }
          this[k] = v;
          break;
        case 'mode':
          if (v !== 'Rule' && v !== 'Direct' && v !== 'Global') {
            throw `Invalid mode: ${v}`;
          }
          this[k] = v;
          break;
        case 'allow-lan':
          if (v !== 'true' && v !== 'false') {
            throw `Invalid allow-lan settings: ${v}`;
          }
          this[k] = v === 'true';
          break;
        default:
          throw `Unknown key: '${k}'`;
      }
    }
  }
}
