import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

export const xinhuanetCom: SiteObj = {
  name: '新华网',
  domains: ['xinhuanet.com', 'www.xinhuanet.com'],
};

export class XinhuanetComCrawler extends Crawler {
  site = xinhuanetCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(xinhuanetCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('div.h-title', el => el.textContent.trim());
      article.abstract = await safe(page.$eval(
        'meta[name="description"]:not([itemprop="description"])',
        el => el.getAttribute('content').split('---')[1].trim(),
      ));
      article.content = await page.$$eval(
        '#p-detail>p, #p-detail>.main-aticle>p',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );
      article.source = await safe(page.$eval('#source, .aticle-src', el => el.textContent.trim()));
      const timeStr = await page.$eval('span.h-time', el => el.textContent.trim());
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://www.xinhuanet.com/', { waitUntil: 'networkidle2' });

    const urls = await page.$$eval(
      'a',
      els => els
        .map(el => el.getAttribute('href'))
        .filter(el => {
          if (el === null) return false;
          if (!el.startsWith('http://www.xinhuanet.com/')) return false;

          const url = new URL(el);
          const pathname = url.pathname.slice(1).split('/');
          if (pathname[0] === 'video') return false;
          if (!pathname[pathname.length - 1].startsWith('c_')) return false;
          if (!pathname[pathname.length - 1].endsWith('.htm')) return false;

          return true;
        }),
    );

    return _.uniq(urls);
  }
}
