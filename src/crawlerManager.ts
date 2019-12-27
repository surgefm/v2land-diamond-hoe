import { promises as fs } from 'fs';
import * as path from 'path';
import { Crawler } from '@Types';
import { Article } from '@Models';
import { crawlerConfig } from '@Config';
import { takeScreenShot, cleanPageStyle } from '@Utils';
import { uploadToS3 } from '@/awsS3Manager';

export async function crawlPage(crawler: Crawler, url: string): Promise<Article> {
  const urlPage = await crawler.puppeteerPool.acquire();
  await urlPage.setViewport({ width: 1024, height: 768 });
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

  const sites = await fs.readdir(path.join(__dirname, 'sites'));
  for (const site of sites) {
    const siteExports = await import(path.join(__dirname, 'sites', site));
    for (const siteExport in siteExports) {
      if (typeof siteExports[siteExport] === 'function') {
        try {
          const crawler = new siteExports[siteExport]();
          if (crawler instanceof Crawler) {
            await crawler.init();
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
