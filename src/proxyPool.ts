import { promises as fs } from 'fs';
import * as path from 'path';
import { ProxyCrawler } from '@Types';

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
            global.proxies = global.proxies.concat(await proxyCrawler.crawlProxies());
          }
        } catch (err) {}
      }
    }
  }
}

export default initializeProxyPool;
