/* eslint-disable no-unused-vars */
import { Pool } from 'generic-pool';
import { Browser } from 'puppeteer';

declare global {
  namespace NodeJS {
    interface Global {
      puppeteerPool: Pool<Browser>;
    }
  }
}
