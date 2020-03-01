import * as log from 'loglevel';

export interface Config {
    "port"?: number;
    "socks-port"?: number;
    "redir-port"?: string;
    "allow-lan"?: boolean;
    "mode"?: string;
    "log-level"?: string;
}

export function parseConfig(raw: string): Config {
    let config: Config = {};
    raw.split(",").forEach(a => {
        let r = a.split(":", 2);
        switch (r[0]) {
            case "port":
                config.port = parseInt(r[1]);
                break;
            case "socks-port":
                config["socks-port"] = parseInt(r[1]);
                break;
            case "redir-port":
                config["redir-port"] = r[1];
                break;
            case "allow-lan":
                config["allow-lan"] = r[1].toLowerCase() !== "false";
                break;
            case "mode":
                config["mode"] = r[1];
                break;
            case "log-level":
                config["log-level"] = r[1];
                break;
            default:
                log.warn(`Unknown config key: ${r[0]}`)
                break;
        }
    });
    log.info(`Parsed config: ${JSON.stringify(config)}`);
    return config;
}