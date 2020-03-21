import { Syncer } from './syncer';
import { Config } from './config';
import { GroupPolicy } from './policy';

import { Command, flags } from '@oclif/command';

import * as log from 'loglevel';
import * as prefix from 'loglevel-plugin-prefix';
import * as path from 'path';

prefix.reg(log);
prefix.apply(log, { template: '[%t] %l:' });
log.enableAll();

class ClashSubscriber extends Command {
  static DEFAULT_INTERVAL = 60;
  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      default: '/etc/clash/config.yaml',
      description: 'file to save the configuration',
    }),
    'virtual-path': flags.string({
      char: 'p',
      description:
        'virtual file path to load the configuration. useful in docker. default value as same as the `file`',
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
        'extra configurations for Clash, e.g. port=1081 socks-port=1080 allow-lan=false external-controller=172.18.0.2:9090',
    }),
    filter: flags.string({
      char: 'r',
      description: 'use a regex to filter proxy',
    }),
    'group-policy': flags.string({
      char: 'G',
      multiple: true,
      description:
        'apply a group policy to proxies, retain only one proxy group and match rule',
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
    if (!flags['virtual-path']) {
      flags['virtual-path'] = flags.file;
    }
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
          log.error(`Fail to parse config: ${flags.config}; reason: ${err}.`);
          process.exit(1);
        }

        if (flags['filter']) {
          try {
            const regex = new RegExp(flags['filter']);
            config.filter(regex);
          } catch (e) {
            log.error(`Invalid regex: ${flags['filter']}; reason: ${e}.`);
            process.exit(1);
          }
        }

        if (flags['group-policy'].length > 0) {
          const groupPolicy = new GroupPolicy(flags['group-policy']);
          config.registerGroupPolicy(groupPolicy);
        }

        try {
          log.info(`Saving configuration to ${flags.file}.`);
          config.saveToPath(flags.file);
        } catch (err) {
          log.error(`Fail to save config to ${flags.file}; reason: ${err}.`);
          return;
        }

        log.info(`Injecting config to ${config.controller}.`);
        await config
          .forceLoad(<string>flags['virtual-path'])
          .then(() => {
            log.info('Successfully updated.');
          })
          .catch((err) => {
            log.error(
              `Fail to update clash config via: ${config.controller}; reason: ${err}.`,
            );
            process.exit(1);
          });

        log.info('Applying group policy.');
        await config.applyGroupPolicy();
      },
    });

    syncer.run();
  }
}

export = ClashSubscriber;
