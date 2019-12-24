import * as puppeteer from 'puppeteer';
import { Pool, Factory, Options, createPool } from 'generic-pool';
import { Page } from 'puppeteer';
import { puppeteerConfig } from '../config';

export default async function initializePuppeteerPool(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: puppeteerConfig.headless,
  });

  const puppeteerFactory: Factory<Page> = {
    create: async (): Promise<Page> => {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(120000);
      return page;
    },
    destroy: async (page: Page): Promise<void> => {
      await page.close();
    },
  };

  const options: Options = {
    max: 5,
    min: 0,
  };

  const pool: Pool<Page> = createPool(puppeteerFactory, options);
  global.puppeteerPool = pool;
}
