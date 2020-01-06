import { promises as fs } from 'fs';
import * as path from 'path';
import { Crawler, Proxy } from '@Types';
import { Article } from '@Models';
import { crawlerConfig } from '@Config';
import { takeScreenShot, cleanPageStyle, getCrawler, useProxy } from '@Utils';
import { uploadToS3 } from '@/awsS3Manager';
import { acquireProxy } from '@/proxyPool';
import { Page } from 'puppeteer';

export async function crawlPage(url: string): Promise<Article> {
  const crawler = await getCrawler(url);
  if (crawler === null) {
    throw new Error('Crawler for this URL cannot be found.');
  }

  let urlPage: Page;
  let proxy: Proxy;
  if (crawler.useProxy) {
    [urlPage, proxy] = await Promise.all([
      crawler.puppeteerPool.acquire(),
      acquireProxy(crawler.proxyOptions),
    ]);
    if (proxy !== null) {
      await useProxy(urlPage, proxy);
    }
  } else {
    urlPage = await crawler.puppeteerPool.acquire();
  }
  await urlPage.setViewport({ width: 1440, height: 768 });
  let pageDeleted = false;

  try {
    const [article, crawledSuccessfully] = await crawler.crawlArticle(urlPage, url);

    if (article !== null && crawledSuccessfully) {
      if (crawlerConfig.takeScreenshot) {
        const filename = `${encodeURIComponent(url)}_${Math.floor(Date.now() / 60000)}`;

        let [file, p] = await takeScreenShot(urlPage, filename);
        const fileKey = await uploadToS3({
          file,
          key: `${filename}.jpeg`,
          path: p,
          deleteOriginalFile: true,
        });
        article.screenshot = fileKey;

        await cleanPageStyle(urlPage);
        [file, p] = await takeScreenShot(urlPage, `${filename}.clean_style`);
        await crawler.puppeteerPool.destroy(urlPage);
        pageDeleted = true;
        await uploadToS3({
          file,
          key: `${filename}.clean_style.jpeg`,
          path: p,
          deleteOriginalFile: true,
        });
      }

      article.status = 'crawled';
      await article.save();
    }

    return article;
  } catch (err) {
    throw err;
  } finally {
    if (!pageDeleted) {
      await crawler.puppeteerPool.destroy(urlPage);
    }
  }
}

export async function getCrawlingTask(crawler: Crawler): Promise<Article[]> {
  const page = await crawler.puppeteerPool.acquire();
  const urlList = await crawler.getArticleList(page);
  await crawler.puppeteerPool.destroy(page);

  return Promise.all(urlList.map((url: string) => crawlPage(url)));
}

export async function crawlAll(): Promise<void> {
  const tasks = global.crawlers.map((crawler: Crawler) => getCrawlingTask(crawler));

  try {
    await Promise.all(tasks);
  } catch (err) {}

  setTimeout(crawlAll, crawlerConfig.interval);
}

export async function initializeCrawlerManager(crawl = true): Promise<void> {
  const crawlers: Crawler[] = [];
  global.domainToCrawlerMap = {};

  const dirs = await fs.readdir(path.join(__dirname, 'sites'));
  for (const dir of dirs) {
    let sites = await fs.readdir(path.join(__dirname, 'sites', dir));
    sites = sites.filter(site => site.endsWith('.js'));
    for (const site of sites) {
      const siteExports = await import(path.join(__dirname, 'sites', dir, site));
      for (const siteExport in siteExports) {
        if (typeof siteExports[siteExport] === 'function') {
          try {
            const crawler = new siteExports[siteExport]();
            if (crawler instanceof Crawler) {
              await crawler.init();
              crawlers.push(crawler as Crawler);
              for (const domain of crawler.domains) {
                global.domainToCrawlerMap[domain] = crawler;
              }
            }
          } catch (err) {}
        }
      }
    }
  }

  global.crawlers = crawlers;

  if (crawl) {
    crawlAll();
  }
}

export default initializeCrawlerManager;
