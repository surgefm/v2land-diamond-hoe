import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

export const theInitiumCom: SiteObj = {
  name: '端传媒',
  domains: ['www.theinitium.com', 'theinitium.com'],
};

export class TheInitiumCrawler extends Crawler {
  site = theInitiumCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(theInitiumCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('h1[itemprop="headline name"]', el => el.textContent);
      article.abstract = await safe(page.$eval('p[itemprop="description"]', el => el.textContent));
      article.content = await page.$$eval(
        'div[itemprop="articleBody"] p, div[itemprop="articleBody"] h2',
        els => els.map(el => el.textContent).join('\n'),
      );
      const timeStr = await page.$eval('time[itemprop="datePublished"]', el => el.getAttribute('datetime'));
      article.time = new Date(timeStr);

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('https://theinitium.com/', { waitUntil: 'networkidle2' });

    let urls = await page.$$eval(
      `section.c-top-news a.u-linkClean,
       section.c-top-news--slides ul li .c-digest>a,
       section.c-whats-new>ul>li>div.c-digest>a,
       section.c-columns-new>ul>li>div.c-digest>a,
       section.c-list-articles ol li a`,
      els => els.map(el => 'https://theinitium.com' + el.getAttribute('href')),
    );

    urls = _.uniq(urls);

    return urls;
  }
}
