import initializePuppeteerPool from '@/puppeteerPool';
import initializeSequelize from '@/sequelize';
import initializeCrawlerManager, { crawlPage } from '@/crawlerManager';

import { getCrawler } from '@Utils';

import 'source-map-support/register';

// Display Puppeteer Chrome
process.env.HEADLESS = '0';

async function init(): Promise<void> {
  await initializePuppeteerPool();
  await initializeSequelize();
  await initializeCrawlerManager(false);

  // Debug below

  // const url = 'http://politics.people.com.cn/n1/2019/1224/c1024-31520903.html';
  // await Article.destroy({ where: { url } });

  // const crawler = await getCrawler('news.people.com.cn');
  // const article = await crawlPage(crawler, url);
  // console.log(article.get({ plain: true }));

  const crawler = await getCrawler('news.people.com.cn');
  const page = await global.puppeteerPool.acquire();
  const articleList = await crawler.getArticleList(page);
  console.log(articleList);
}

init();
