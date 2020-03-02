import * as yaml from 'js-yaml';
import * as log from 'loglevel';
import axios from 'axios';

export class Syncer {
  url: string;
  interval: number;
  modifier: (_: any) => Promise<void>;
  constructor(url: string, opts: SyncOptions) {
    const link = opts.args?.reduce((url, opt) => `${url}&${opt}`, url) || url;

    this.url = link;
    this.modifier =
      opts.modifier ||
      (async (yml) => {
        console.log(yml);
      });
    this.interval = opts.interval;
  }

  fetch() {
    axios
      .get<string>(this.url)
      .then(({ data }) => this.modifier(yaml.safeLoad(data)))
      .catch(() => log.error(`Fail to fetch data from ${this.url}`));
  }

  public run() {
    this.fetch();
    setInterval(() => this.fetch(), this.interval);
  }
}

export interface SyncOptions {
  args?: string[];
  interval: number;
  modifier?: (_: any) => Promise<void>;
}
