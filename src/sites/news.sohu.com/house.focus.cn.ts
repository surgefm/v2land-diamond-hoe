import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, removeURLQuery } from '@Utils';
import { Page } from 'puppeteer';

export const houseFocusCn: SiteObj = {
  name: '搜狐焦点',
  domains: ['house.focus.cn'],
};

export class HouseFocusCnCrawler extends Crawler {
  site = houseFocusCn;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);

    const [article, proceed] = await checkArticleWithURL(houseFocusCn, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('.main-content>h1', el => el.textContent.trim());
      article.abstract = await page.$eval('meta[name="description"]', el => el.getAttribute('content'));
      article.content = await page.$$eval(
        'div.info-content p',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );

      article.source = await page.$eval('div.info-source span:first-child a', el => el.textContent);

      const timeStr = await page.$eval('div.info-source span:last-child', el => el.textContent);
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }
}
