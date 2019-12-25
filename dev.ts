import 'source-map-support/register';
import 'module-alias/register';

import initializePuppeteerPool from '@/puppeteerPool';
import initializeSequelize from '@/sequelize';
import initializeCrawlerManager, { crawlPage } from '@/crawlerManager';

import { getCrawler } from '@Utils';

// Display Puppeteer Chrome
process.env.HEADLESS = '0';

async function init(): Promise<void> {
  await initializePuppeteerPool();
  await initializeSequelize();
  await initializeCrawlerManager(false);

  // Debug below

  // const crawler = await getCrawler('news.people.com.cn');
  // const article = await crawlPage(crawler, url);
  // console.log(article.get({ plain: true }));

  const crawler = await getCrawler('www.theinitium.com');
  const page = await global.puppeteerPool.acquire();
  const article = await crawler.getArticleList(page);
  console.log(article);

  // console.log(articleList);
}

init();
