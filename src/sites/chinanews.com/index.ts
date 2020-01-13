import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe, removeURLQuery, getCrawlerWithDomain } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

export const chinaNewsCom: SiteObj = {
  name: '中国新闻网',
  domains: ['www.chinanews.com', 'm.chinanews.com'],
};

export class ChinaNewsComCrawler extends Crawler {
  site = chinaNewsCom;
  domains = ['www.chinanews.com'];

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);

    const [article, proceed] = await checkArticleWithURL(chinaNewsCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('.content>h1', el => el.textContent.trim());
      article.abstract = await safe(page.$eval('meta[name="description"]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        '.content>.left_zw>p:not(.pictext)',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );
      article.source = await safe(page.$eval('.left-time a.source', el => el.textContent.trim()));
      const timeStr = await page.$eval('.left-time>.left-t', el => el.textContent.trim().split('　')[0]);
      article.time = new Date(timeStr.replace('年', '-').replace('月', '-').replace('日', '') + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://www.chinanews.com/', { waitUntil: 'networkidle2' });

    const urls = await page.$$eval(
      'a',
      els => els
        .map(el => el.getAttribute('href'))
        .filter(el => el)
        .map(el => el.startsWith('//') ? ('http:' + el) : el)
        .filter(el => el.startsWith('http://www.chinanews.com/') && el.match(/\/[0-9]+.shtml/))
        .filter(el => new URL(el).pathname.split('/').length === 5),
    );

    return _.uniq(urls);
  }
}

export class MChinaNewsComCrawler extends Crawler {
  site = chinaNewsCom;
  domains = ['m.chinanews.com'];

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);
    const Url = new URL(url);
    if (!url.endsWith('.shtml') || Url.pathname.split('/').length < 5) {
      throw new Error('This doesn’t look like a URL to a chinanews.com article.');
    }

    let pathname = Url.pathname.split('/');
    pathname = pathname.slice(pathname.length - 4);

    const crawler = await getCrawlerWithDomain('www.chinanews.com');
    return crawler.crawlArticle(page, `http://www.chinanews.com/${pathname.join('/')}`);
  }
}
