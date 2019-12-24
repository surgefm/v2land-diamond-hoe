import * as fs from 'fs';
import * as path from 'path';
import { Crawler } from './types';
import { crawlerConfig } from './config';
import { mkdir, takeScreenShot, cleanPageStyle } from './utils';

export async function crawlPage(crawler: Crawler, url: string): Promise<void> {
  const urlPage = await global.puppeteerPool.acquire();
  await urlPage.setViewport({ width: 1024, height: 768 });
  await crawler.crawlArticle(urlPage, url);

  if (crawlerConfig.takeScreenshot) {
    await mkdir(path.join(__dirname, '../snapshots'));
    const filename = `${encodeURIComponent(url)}_${Math.floor(Date.now() / 60000)}`;
    await takeScreenShot(urlPage, path.join(__dirname, '../snapshots', `${filename}.jpeg`));
    await cleanPageStyle(urlPage);
    await takeScreenShot(urlPage, path.join(__dirname, '../snapshots', `${filename}.clean_style.jpeg`));
  }

  await global.puppeteerPool.destroy(urlPage);
}

export async function getCrawlingTask(crawler: Crawler): Promise<void> {
  const page = await global.puppeteerPool.acquire();
  const urlList = await crawler.getArticleList(page);
  await global.puppeteerPool.destroy(page);

  await Promise.all(urlList.map((url: string) => crawlPage(crawler, url)));
}

export async function crawlAll(): Promise<void> {
  const tasks = global.crawlers.map((crawler: Crawler) => getCrawlingTask(crawler));

  try {
    await Promise.all(tasks);
  } catch (err) {}

  setTimeout(crawlAll, 15 * 60 * 1000);
}

export async function initializeCrawlerManager(): Promise<void> {
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

  global.crawlers = crawlers;
  crawlAll();
}

export default initializeCrawlerManager;
