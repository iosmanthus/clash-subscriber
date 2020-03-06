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
    filter: flags.string({
      char: 'r',
      description: 'use a regex to filter proxy',
    }),
    'url-test-group-only': flags.boolean({
      char: 'A',
      description:
        'strip out all rules and proxy groups except for a url-test group via a url',
    }),
    'test-url': flags.string({
      default: 'http://www.gstatic.com/generate_204',
      dependsOn: ['url-test-group-only'],
      description: 'test url, valid only while flag `url-test-only` is set',
    }),
    'test-interval': flags.string({
      default: '600',
      dependsOn: ['url-test-group-only'],
      description:
        'test interval, valid only while flag `url-test-only` is set, in seconds',
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

        let config: Config;
        try {
          config = new Config(flags.config, yml);
        } catch (err) {
          log.error(err);
          process.exit(1);
        }

        if (flags['filter']) {
          try {
            const regex = new RegExp(flags['filter']);
            config.filter(regex);
          } catch (e) {
            log.error(`Invalid regex: ${flags['filter']}. reason: ${e}`);
            process.exit(1);
          }
        }

        if (flags['url-test-group-only']) {
          const interval = parseInt(flags['test-interval'], 10) || 600;
          config.urlTestGroupOnly(flags['test-url'], interval);
        }

        try {
          log.info(`Saving configuration to ${flags.file}.`);
          fs.writeFileSync(flags.file, yaml.safeDump(config.dump()));
        } catch {
          log.error(`Fail to save config to ${flags.file}.`);
          return;
        }

        log.info(`Injecting config to ${flags.controller}.`);
        await axios
          .put(`${flags.controller}/configs?force=${true}`, {
            path: flags.file,
          })
          .then(() => log.info('Successfully updated.'))
          .catch((err) => {
            log.error(`Fail to update clash config via: ${flags.controller}.
              reason: ${err}`);
          });
      },
    });

    syncer.run();
  }
}

export = ClashSubscriber;
