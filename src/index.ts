import { Syncer } from './syncer';
import { Config } from './config';

import { Command, flags } from '@oclif/command';
import axios from 'axios';

import * as fs from 'fs';
import * as log from 'loglevel';
import * as prefix from 'loglevel-plugin-prefix';
import * as yaml from 'js-yaml';
import * as path from 'path';

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
    file: flags.string({
      char: 'f',
      default: '/etc/clash/config.yaml',
      description: 'file to save the configuration',
    }),
    interval: flags.string({
      char: 'i',
      default: `${ClashSubscriber.DEFAULT_INTERVAL}`,
      description: 'interval to fetch configuration, in minutes',
    }),
    config: flags.string({
      char: 'c',
      multiple: true,
      description:
        'extra configurations for Clash, e.g. port=1081 socks-port=1080 allow-lan:false',
    }),
    url: flags.string({
      char: 'l',
      required: true,
      description: 'subscription link',
    }),
  };

  static usage = '[options] -l/--url URL';

  async run() {
    const { flags } = this.parse(ClashSubscriber);
    flags.file = path.resolve(flags.file);
    const syncer = new Syncer(flags.url, {
      interval:
        (parseFloat(flags.interval) || ClashSubscriber.DEFAULT_INTERVAL) *
        60_000,

      modifier: async (yml) => {
        log.info('Fetch successfully.');

        log.info('Parsing configurations.');
        let data = yml;
        try {
          data = { ...data, ...new Config(flags.config) };
        } catch (err) {
          log.error(err);
          process.exit(1);
        }

        try {
          log.info(`Saving configuration to ${flags.file}`);
          fs.writeFileSync(flags.file, yaml.safeDump(data));
        } catch {
          log.error(`Fail to save config to ${flags.file}`);
          return;
        }

        log.info(`Injecting config to ${flags.controller}`);
        await axios
          .put(`${flags.controller}/configs?force=${true}`, {
            path: flags.file,
          })
          .then(() => log.info('Successfully updated'))
          .catch((err) => {
            log.error(`Fail to update clash config via: ${flags.controller}
              reason: ${err}`);
          });
      },
    });

    syncer.run();
  }
}

export = ClashSubscriber;
