import { Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe, removeURLQuery } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

import { huanqiuCom } from './index';

export class ChamberHuanqiuComCrawler extends Crawler {
  site = huanqiuCom;
  domains = ['chamber.huanqiu.com'];

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);
    let [article, proceed] = await checkArticleWithURL(huanqiuCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('.l_a h1.tle', el => el.textContent);
      article.abstract = await page.$eval('meta[name="description"]', el => el.getAttribute('content'));
      article.content = await page.$$eval(
        '.la_con>p',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );
      article.source = await safe(page.$eval('.la_tool .la_t_b a', el => el.textContent.trim()));
      article.sourceUrl = await safe(page.$eval('.la_tool .la_t_b a', el => el.getAttribute('href')));
      const timeStr = await page.$eval('.la_tool span.la_t_a', el => el.textContent.trim());
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('https://www.huanqiu.com/', { waitUntil: 'networkidle2' });

    let urls = await page.$$eval(
      'a',
      els => els.map(el => el.getAttribute('href')),
    );

    urls = urls
      .map(url => {
        if (url.startsWith('//')) url = 'https:' + url;
        else if (url.startsWith('http://')) url = 'https' + url.slice(4);

        return url;
      })
      .filter(url => {
        const Url = new URL(url);
        return huanqiuCom.domains.includes(Url.hostname) && Url.pathname.split('/').length > 2;
      });

    return _.uniq(urls);
  }
}
