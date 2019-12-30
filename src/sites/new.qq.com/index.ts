import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const newQQCom: SiteObj = {
  name: '腾讯新闻',
  domains: ['new.qq.com'],
};

export class NewQQComCrawler extends Crawler {
  site = newQQCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(newQQCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('div.LEFT h1', el => el.textContent.trim());
      article.abstract = await safe(page.$eval('.content-article .introduction', el => el.textContent.trim()));
      if (article.abstract === null) {
        article.abstract = await safe(page.$eval('meta[name="description"]', el => el.getAttribute('content')));
      }
      article.content = await page.$$eval(
        '.content-article p.one-p',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );
      article.source = await safe(page.$eval(
        'span[data-bosszone="ly"], a[data-bosszone="author_name"]>div',
        el => el.textContent.trim(),
      ));
      const timeStr = await page.$eval('#LeftTool div.year>span', el => el.textContent) + '-' +
        await page.$eval('#LeftTool div.md', el => el.textContent.replace('/', '-')) + ' ' +
        await page.$eval('#LeftTool div.time', el => el.textContent);
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('https://new.qq.com/', { waitUntil: 'networkidle2' });

    async function loadMore(): Promise<void> {
      const loadMoreDiv = await page.$('#load-more');

      async function getNewsListLength(): Promise<number> {
        return page.$$eval('#List>.channel_mod>ul.list:not(.top-list)>li', els => els.length);
      }
      const origListLength = await getNewsListLength();
      await loadMoreDiv.hover();

      while (await getNewsListLength() === origListLength) {
        await delay(500);
      }
    }

    for (let i = 0; i < 10; ++i) {
      await loadMore();
    }

    const urls = await page.$$eval(
      `#List .channel_mod ul.list.top-list li h3 a,
       #List .channel_mod ul.list:not(.top-list)>li>a`,
      els => els
        .map(el => el.getAttribute('href'))
        .filter(el => el.startsWith('https://new.qq.com/')),
    );

    return _.uniq(urls);
  }
}
