import { Article } from '@Models';
import { puppeteerConfig } from '@Config';
import SiteObj from './SiteObj';
import initializePuppeteerPool from '@/puppeteerPool';
import { Page } from 'puppeteer';
import { Pool, createPool } from 'generic-pool';

export abstract class Crawler {
  abstract site: SiteObj;
  public puppeteerPool: Pool<Page>;

  public async init(maxSitePageCount?: number): Promise<Crawler> {
    if (typeof global.puppeteerPool === 'undefined') {
      await initializePuppeteerPool();
    }
    this.puppeteerPool = createPool({
      create: async (): Promise<Page> => global.puppeteerPool.acquire(),
      destroy: async (page: Page): Promise<void> => global.puppeteerPool.destroy(page),
    }, {
      max: typeof maxSitePageCount === 'undefined'
        ? puppeteerConfig.maxSitePageCount
        : maxSitePageCount,
      min: 0,
    });
    return this;
  };

  // return [article, crawledSuccessfully]
  abstract crawlArticle(page: Page, url: string): Promise<[Article, boolean]>;
  public async getArticleList(page: Page): Promise<string[]> {
    return [];
  };
}

export default Crawler;
