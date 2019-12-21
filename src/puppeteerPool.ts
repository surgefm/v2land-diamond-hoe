import * as puppeteer from 'puppeteer';
import { Pool, Factory, Options, createPool } from 'generic-pool';
import { Page } from 'puppeteer';
import { BJNewsComCnCrawler } from './sites/bjnews.com.cn/index';
import { Crawler } from './types/index';

export default async function initializePuppeteerPool(): Promise<void> {
  const browser = await puppeteer.launch();

  const puppeteerFactory: Factory<Page> = {
    create: async (): Promise<Page> => {
      return browser.newPage();
    },
    destroy: async (page: Page): Promise<void> => {
      await page.close;
    },
  };

  const options: Options = {
    max: 5,
    min: 0,
  };

  const pool: Pool<Page> = createPool(puppeteerFactory, options);
  global.puppeteerPool = pool;

  const page = await pool.acquire();
  const url = new URL('http://www.bjnews.com.cn/news/2019/12/20/664710.html');
  const crawler: Crawler = new BJNewsComCnCrawler();
  await crawler.crawlArticle(page, url);
}
