import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe, removeURLQuery } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

export const newsSohuCom: SiteObj = {
  name: '搜狐新闻',
  domains: ['www.sohu.com'],
};

export class NewsSohuComCrawler extends Crawler {
  site = newsSohuCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);
    if (url.slice(0, 15) === '//www.sohu.com/') {
      url = 'http:' + url;
    }

    const [article, proceed] = await checkArticleWithURL(newsSohuCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('div.text-title h1', el => el.textContent.trim());
      article.abstract = await safe(page.$eval('meta[name="description"]', el => el.getAttribute('content')));
      article.source = await safe(page.$eval('meta[name="mediaid"]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        'article.article p',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );
      const timeStr = await page.$eval('meta[itemprop="datePublished"]', el => el.getAttribute('content'));
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://news.sohu.com/', { waitUntil: 'networkidle2' });

    const urls = await page.$$eval(
      `div[data-spm*="top-news"]>p>a,
       div[data-spm*="-news"] ul>li>a`,
      els => els
        .map(el => el.getAttribute('href'))
        .filter(el => el.indexOf('//sports.sohu.com/') < 0
          && el.indexOf('javascript:void(0)') < 0
          && el.indexOf('//www.sohu.com/subject/') < 0),
    );

    return _.uniq(urls);
  }
}
