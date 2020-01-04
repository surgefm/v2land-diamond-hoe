import { promises as fs } from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import delay from 'delay';

import { ProxyCrawler, Proxy, ProxyType, ProxyRegion } from '@Types';
import { proxyCrawlerConfig } from '@Config';
import { PriorityQueue } from '@Utils';

let isProxyPoolReady = false;
let hasInitializationBegun = false;

const priorityQueue = new PriorityQueue<(proxy?: Proxy) => any, Proxy>();

function processQueue(proxy: Proxy) {
  const proxyRequest = priorityQueue.poll(proxy);
  if (proxyRequest !== null) {
    proxyRequest(proxy);
  }
}

export interface ProxyOptions {
  regions?: ProxyRegion[],
  types?: ProxyType[],
}

export async function acquireProxy(options: ProxyOptions = {}): Promise<Proxy> {
  if (!hasInitializationBegun) {
    await initializeProxyPool();
  }

  const validate = (proxy: Proxy) => {
    if ((typeof proxy.latency !== 'undefined' && proxy.latency < 0) ||
      (typeof options.regions !== 'undefined' && !options.regions.includes(proxy.region)) ||
      (typeof options.types !== 'undefined' && !options.types.includes(proxy.type))) {
      return false;
    }

    return true;
  }

  const proxies = global.proxies.filter(validate);

  if (proxies.length === 0) {
    if (isProxyPoolReady) return null;
    else {
      await delay(500);
      return acquireProxy(options);
    }
  }
  let availableProxies = proxies.filter(proxy => !proxy.inUse);

  if (availableProxies.length > 0) {
    const proxy = _.minBy(availableProxies, (proxy: Proxy) => proxy.lastUse.getTime());
    proxy.inUse = true;
    return proxy;
  }

  return new Promise(resolve => {
    priorityQueue.push(
      (proxy: Proxy) => {
        proxy.inUse = true;
        resolve(proxy);
      },
      { validate: (input: Proxy) => !input.inUse && validate(input) },
    );
  });
}

export async function releaseProxy(proxy: Proxy): Promise<void> {
  if (proxy === null) return;

  await delay(500);
  proxy.lastUse = new Date();
  proxy.inUse = false;

  processQueue(proxy);
}

export async function updateProxyPool(): Promise<void> {
  setTimeout(updateProxyPool, proxyCrawlerConfig.interval);

  const proxyStrings = global.proxies.map(proxy => proxy.toString(true));

  await Promise.all(global.proxyCrawlers.map(proxyCrawler => (async () => {
    const newProxies = await proxyCrawler.crawlProxies();
    await Promise.all(newProxies.map(proxy => proxy.benchmark()));
    newProxies
      .filter(proxy => proxy.latency >= 0 && proxyStrings.indexOf(proxy.toString(true)) < 0)
      .map(proxy => {
        global.proxies.push(proxy);
        processQueue(proxy);
        proxyStrings.push(proxy.toString(true));
      });
  })()));

  isProxyPoolReady = true;
}

export async function initializeProxyPool(): Promise<void> {
  hasInitializationBegun = true;

  global.proxies = [];
  global.proxyCrawlers = [];

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
