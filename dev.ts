import 'source-map-support/register';
import 'module-alias/register';
import * as dotenv from 'dotenv';
dotenv.config();

import initializePuppeteerPool from '@/puppeteerPool';
import initializeSequelize from '@/sequelize';
import initializeCrawlerManager from '@/crawlerManager';

import { getCrawler } from '@Utils';

// Display Puppeteer Chrome
process.env.HEADLESS = '0';

async function init(): Promise<void> {
  await initializePuppeteerPool();
  await initializeSequelize();
  await initializeCrawlerManager(false);

  // Debug below
  const crawler = await getCrawler('news.163.com');
  const page = await crawler.puppeteerPool.acquire();
  const urls = await crawler.getArticleList(page);
  await crawler.puppeteerPool.destroy(page);
  console.log(urls);
}

init();
