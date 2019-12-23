import * as fs from 'fs';
import * as path from 'path';
import { Crawler } from './types';

async function initCrawlerManager(): Promise<void> {
  const crawlers: Crawler[] = [];

  const sites = fs.readdirSync(path.join(__dirname, 'sites'));
  for (const site of sites) {
    const siteExports = await import(path.join(__dirname, 'sites', site));
    for (const siteExport in siteExports) {
      if (typeof siteExports[siteExport] === 'function') {
        try {
          const crawler = new siteExports[siteExport]();
          if (crawler instanceof Crawler) {
            crawlers.push(crawler as Crawler);
          }
        } catch (err) {}
      }
    }
  }
}

export default initCrawlerManager;
