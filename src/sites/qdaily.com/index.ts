import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe, removeURLQuery } from '@Utils';
import { Page } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const qdailyCom: SiteObj = {
  name: '好奇心日报',
  domains: ['www.qdaily.com'],
};

export class QdailyComCrawler extends Crawler {
  site = qdailyCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);

    const [article, proceed] = await checkArticleWithURL(qdailyCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('h2.title', el => el.textContent.trim());
      article.abstract = await safe(page.$eval('meta[name="description"]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        '.article-detail-bd>.detail>*:not(.lazylood)',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );

      article.source = await page.$eval('.author .name', el => el.textContent.trim());

      const timeStr = await page.$eval('.date.smart-date', el => el.getAttribute('data-origindate'));
      article.time = new Date(timeStr);

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('https://www.qdaily.com/', { waitUntil: 'networkidle2' });

    async function loadMore(): Promise<void> {
      await delay(500);
      const button = await safe(page.$('.com-loader>.loader-bd>a'));
      if (button === null) return loadMore();

      await button.evaluate(el => (el as any).style.display = 'block');

      const origCount = await page.$eval('.packery-container.articles', el => el.childElementCount);
      await button.click();

      for (let i = 0; i < 10; i++) {
        await delay(500);
        if (await page.$eval('.packery-container.articles', el => el.childElementCount) !== origCount) {
          return;
        }
      }

      return;
    }

    for (let i = 0; i < 10; ++i) {
      await loadMore();
    }

    const urls = await page.$$eval(
      'a',
      els => els
        .map(el => 'https://www.qdaily.com' + el.getAttribute('href'))
        .filter(el => el.startsWith('https://www.qdaily.com/articles/')),
    );

    return _.uniq(urls);
  }
}
