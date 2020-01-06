import { Article } from '@Models';
import { puppeteerConfig } from '@Config';
import SiteObj from './SiteObj';
import initializePuppeteerPool from '@/puppeteerPool';
import { Page } from 'puppeteer';
import { Pool, createPool } from 'generic-pool';
import { ProxyOptions } from '@/proxyPool';

export abstract class Crawler {
  abstract site: SiteObj;
  public domains: string[];
  public puppeteerPool: Pool<Page>;
  public useProxy = false;
  public proxyOptions: ProxyOptions = {};

  public async init(maxSitePageCount?: number): Promise<Crawler> {
    if (typeof this.domains === 'undefined') {
      this.domains = this.site.domains;
    }

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getArticleList(page: Page): Promise<string[]> {
    return [];
  };
}

export default Crawler;
