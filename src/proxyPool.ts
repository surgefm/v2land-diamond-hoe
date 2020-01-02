import { promises as fs } from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import delay from 'delay';

import { ProxyCrawler, Proxy, ProxyType, ProxyRegion } from '@Types';
import { proxyCrawlerConfig } from '@Config';

let proxyPoolReady = false;

export interface ProxyOptions {
  regions?: ProxyRegion[],
  types?: ProxyType[],
}

export async function acquireProxy(options?: ProxyOptions): Promise<Proxy> {
  if (!proxyPoolReady) {
    await delay(1000);
    return acquireProxy(options);
  }

  const proxies = global.proxies.filter(proxy => {
    if ((typeof proxy.latency !== 'undefined' && proxy.latency < 0) ||
      (typeof options.regions !== 'undefined' && !options.regions.includes(proxy.region)) ||
      (typeof options.types !== 'undefined' && !options.types.includes(proxy.type))) {
      return false;
    }

    return true;
  });

  return proxies[Math.floor(Math.random() * proxies.length)];
}

export async function updateProxyPool(): Promise<void> {
  setTimeout(updateProxyPool, proxyCrawlerConfig.interval);

  const proxyToString = (proxy: Proxy) => {
    return `${proxy.type} ${proxy.address}:${proxy.port}`;
  };

  for (const proxyCrawler of global.proxyCrawlers) {
    global.proxies = _.uniqBy(
      global.proxies.concat(await proxyCrawler.crawlProxies()),
      proxyToString,
    );
  }

  proxyPoolReady = true;
}

export async function initializeProxyPool(): Promise<void> {
  global.proxies = [];

  let dirs = await fs.readdir(path.join(__dirname, 'proxies'));
  dirs = dirs.filter(proxyCrawler => proxyCrawler.endsWith('.js'));
  for (const dir of dirs) {
    const proxyCrawlerExports = await import(path.join(__dirname, 'proxies', dir));
    for (const proxyCrawlerExport in proxyCrawlerExports) {
      if (typeof proxyCrawlerExports[proxyCrawlerExport] === 'function') {
        try {
          const proxyCrawler = new proxyCrawlerExports[proxyCrawlerExport]();
          if (proxyCrawler instanceof ProxyCrawler) {
            global.proxyCrawlers.push(proxyCrawler);
          }
        } catch (err) {}
      }
    }
  }

  updateProxyPool();
}

export default initializeProxyPool;
