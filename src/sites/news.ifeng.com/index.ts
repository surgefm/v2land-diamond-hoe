import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const newsIfengCom: SiteObj = {
  name: '凤凰网',
  domains: ['news.ifeng.com'],
};

export class NewsIfengComCrawler extends Crawler {
  site = newsIfengCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(newsIfengCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('meta[property="og:title"', el => el.getAttribute('content'));
      article.abstract = await safe(page.$eval('meta[property="og:description"]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        'div[class^="main_content-"]>div>div[class^="text-"]>p:not(.detailPic):not(.picIntro)',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );
      article.source = await safe(page.$eval(
        'span[class^="publisher-"]>span[class^="source-"]>a',
        el => el.textContent.trim(),
      ));
      const timeStr = await page.$eval('meta[name="og:time "]', el => el.getAttribute('content'));
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('https://news.ifeng.com/', { waitUntil: 'networkidle2' });

    async function loadMore(): Promise<boolean> {
      const button = await safe(page.$('a.news-stream-basic-more'));
      if (button === null) return loadMore();
      await button.click();
      await delay(500);
      while (true) {
        if (await safe(page.$('a.news-stream-basic-more')) !== null) {
          return true;
        } else if (await safe(page.$eval('.news-stream-basic-is-end', el => el.textContent === '已显示全部'))) {
          return false;
        }
        await delay(500);
      }
    }

    for (let i = 0; i < 10; ++i) {
      const continueLoading = await loadMore();
      if (!continueLoading) break;
      await delay(1000);
    }

    const urls = await page.$$eval(
      `.news-stream-newsStream-news-item-title>a,
       .top_news_title>a`,
      els => els
        .map(el => 'https:' + el.getAttribute('href'))
        .filter(el => el.startsWith('https://news.ifeng.com/')),
    );

    return _.uniq(urls);
  }
}
