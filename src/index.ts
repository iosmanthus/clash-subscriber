import { Syncer } from './syncer';
import { Command, flags } from '@oclif/command';
import axios from 'axios';
import * as fs from 'fs';
import * as log from 'loglevel';
import * as prefix from 'loglevel-plugin-prefix';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { parseConfig } from './config';

prefix.reg(log);
prefix.apply(log, { template: '[%t] %l:' });
log.enableAll();

class ClashSubscriber extends Command {
  static DEFAULT_INTERVAL = 60;
  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    controller: flags.string({
      char: 't',
      default: 'http://localhost:9090',
    }),
    path: flags.string({
      char: 'p',
      default: '/etc/clash/config.yaml',
    }),
    interval: flags.string({
      char: 'i',
      default: `${ClashSubscriber.DEFAULT_INTERVAL}`,
      description: 'Interval to fetch configuration, in minutes',
    }),
    config: flags.string({
      char: 'c',
      default: '',
      description: "Config the slash, e.g. -c=port:1081,socks-port:1080",
    }),
  };
  static args = [{
    name: 'url',
    required: true,
  }];

  async run() {
    const { args, flags } = this.parse(ClashSubscriber);
    flags.path = path.resolve(flags.path);
    const config = parseConfig(flags.config);
    const syncer = new Syncer(args.url, {
      interval: (parseFloat(flags.interval) || ClashSubscriber.DEFAULT_INTERVAL) * 60_000,
      modifier: async (yml) => {
        log.info(`Fetch successfully.
        Saving to ${flags.path}`);
        let doc = { ...yml, ...config };
        fs.writeFile(flags.path, yaml.safeDump(doc), async (err) => {
          if (err) {
            log.error(`Fail to save config to ${flags.path}`);
            return;
          }
          log.info(`Injecting config to ${flags.controller}`);
          await axios.put(`${flags.controller}/configs`, { path: flags.path })
            .then(res => log.info('Successfully updated.'))
            .catch(
              err => log.error(`Fail to update clash config via: ${flags.controller}.
              reason: ${err.message}`),
            );
        });
      },
    });
    syncer.run();
  }
}

export = ClashSubscriber;
