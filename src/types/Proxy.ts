import * as request from 'request-promise';
import { clearInterval } from 'timers';
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');

import { proxyCrawlerConfig } from '@Config';

export enum ProxyType {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  SOCKS4 = 'SOCKS4',
  SOCKS5 = 'SOCKS5',
}

export enum ProxyRegion {
  mainlandChina = 'MAINLAND_CHINA',
  oversea = 'OVERSEA',
}

export class Proxy {
  address: string;
  port: number;
  type: ProxyType;
  region: ProxyRegion;
  latency?: number;
  inUse: boolean;
  lastUse: Date;
  href: string;
  
  private toStringReturn: string;
  private toStringReturnWithType: string;

  private benchmarkIntervalClock: NodeJS.Timeout;

  constructor(address: string, port: number, type: ProxyType, region: ProxyRegion) {
    this.address = address;
    this.port = port;
    this.type = type;
    this.region = region;

    this.inUse = false;
    this.lastUse = new Date('2000-1-1');

    this.toStringReturn = `${address}:${port}`;
    this.toStringReturnWithType = `${type} ${this.toStringReturn}`;

    this.benchmarkIntervalClock = null;

    let href = type.toLocaleLowerCase();
    if (href.startsWith('http')) href = 'http';
    else if (href.startsWith('socks')) href = 'socks';
    href += `://${this.toStringReturn}`;
    this.href = href;
  }

  public getProxyAgent(): any {
    switch(this.type) {
    case ProxyType.HTTP:
      return new HttpProxyAgent(this.href);
    case ProxyType.HTTPS:
      return new HttpsProxyAgent(this.href);
    case ProxyType.SOCKS4:
    case ProxyType.SOCKS5:
      return new SocksProxyAgent(this.href);
    default:
      return null;
    }
  }

  public async benchmark(): Promise<number> {
    if (this.benchmarkIntervalClock !== null) {
      clearInterval(this.benchmarkIntervalClock);
    }

    const begin = Date.now();
    try {
      await request('http://www.baidu.com', {
        agent: this.getProxyAgent(),
        method: 'GET',
        timeout: 60000,
      });

      this.latency = Date.now() - begin;
    } catch (err) {
      this.latency = -1;
    }

    this.benchmarkIntervalClock = setInterval(this.benchmark, proxyCrawlerConfig.interval);

    return this.latency;
  }

  public toString(withType?: boolean) {
    return withType ? this.toStringReturnWithType : this.toStringReturn;
  }
}

export default Proxy;
