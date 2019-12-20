import * as puppeteer from 'puppeteer';
import { Pool, Factory, Options, createPool } from 'generic-pool';
import { Browser } from 'puppeteer';

const puppeteerFactory: Factory<Browser> = {
  create: async (): Promise<Browser> => {
    return puppeteer.launch();
  },
  destroy: async (browser: Browser): Promise<void> => {
    await browser.close();
  },
};

const options: Options = {
  max: 5,
  min: 0,
};

const pool: Pool<Browser> = createPool(puppeteerFactory, options);
global.puppeteerPool = pool;
