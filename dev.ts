import initializePuppeteerPool from './src/puppeteerPool';
import initializeSequelize from './src/sequelize';
import initializeCrawlerManager, { crawlPage } from './src/crawlerManager';

import { getCrawler } from './src/utils';
import { Article } from './src/models';

import 'source-map-support/register';

// Display Puppeteer Chrome
process.env.HEADLESS = '0';

async function init(): Promise<void> {
  await initializePuppeteerPool();
  await initializeSequelize();
  await initializeCrawlerManager(false);

  // Debug below
  const url = 'http://www.bjnews.com.cn/news/2019/12/24/665710.html';
  await Article.destroy({ where: { url } });

  const crawler = await getCrawler('www.bjnews.com.cn');
  const article = await crawlPage(crawler, url);
  console.log(article);
}

init();
