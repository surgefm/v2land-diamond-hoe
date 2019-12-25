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

  const crawler = await getCrawler('news.sina.com.cn');
  const page = await global.puppeteerPool.acquire();
  const links = await crawler.getArticleList(page);
  console.log(links);

  // console.log(articleList);
}

init();
