import * as fs from 'fs';
import * as path from 'path';
import { Crawler } from '@Types';
import { Article } from '@Models';
import { crawlerConfig } from '@Config';
import { takeScreenShot, cleanPageStyle } from '@Utils';

export async function crawlPage(crawler: Crawler, url: string): Promise<Article> {
  const urlPage = await global.puppeteerPool.acquire();
  await urlPage.setViewport({ width: 1024, height: 768 });

  try {
    const [article, crawledSuccessfully] = await crawler.crawlArticle(urlPage, url);

    if (article !== null && crawledSuccessfully) {
      if (crawlerConfig.takeScreenshot) {
        const filename = `${encodeURIComponent(url)}_${Math.floor(Date.now() / 60000)}`;
        await takeScreenShot(urlPage, filename);
        await cleanPageStyle(urlPage);
        await takeScreenShot(urlPage, `${filename}.clean_style`);
        article.screenshot = filename;
      }

      article.status = 'crawled';
      await article.save();
    }

    return article;
  } catch (err) {
    throw err;
  } finally {
    await global.puppeteerPool.destroy(urlPage);
  }
}

export async function getCrawlingTask(crawler: Crawler): Promise<Article[]> {
  const page = await global.puppeteerPool.acquire();
  const urlList = await crawler.getArticleList(page);
  await global.puppeteerPool.destroy(page);

  return Promise.all(urlList.map((url: string) => crawlPage(crawler, url)));
}

export async function crawlAll(): Promise<void> {
  const tasks = global.crawlers.map((crawler: Crawler) => getCrawlingTask(crawler));

  try {
    await Promise.all(tasks);
  } catch (err) {}

  setTimeout(crawlAll, 15 * 60 * 1000);
}

export async function initializeCrawlerManager(crawl = true): Promise<void> {
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

  if (crawl) {
    crawlAll();
  }
}

export default initializeCrawlerManager;
