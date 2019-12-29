import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page, ElementHandle } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const infzmCom: SiteObj = {
  name: '南方周末',
  domains: ['infzm.com', 'www.infzm.com'],
};

export class InfzmComCrawler extends Crawler {
  site = infzmCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(infzmCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('div.nfzm-content__title h1', el => el.textContent);
      article.abstract = await safe(page.$eval('meta[name="description"]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        'div.nfzm-content__fulltext p:not(.contentImg), div.nfzm-content__content blockquote.nfzm-bq',
        els => els.map(el => el.textContent).join('\n'),
      );
      article.source = await safe(page.$eval('meta[name="author"]', el => el.getAttribute('content')));
      const timeStr = await page.$eval('span.nfzm-content__publish', el => el.getAttribute('data-time'));
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://infzm.com/topics/t2.html', { waitUntil: 'networkidle2' });

    async function getLoadMoreButton(): Promise<ElementHandle<Element>> {
      await delay(500);
      const button = await page.$('.nfzm-list__more button');
      if (await button.evaluate(el => el.classList.contains('disabled'))) {
        return getLoadMoreButton();
      }
      return button;
    }

    for (let i = 0; i < 10; ++i) {
      const button = await getLoadMoreButton();
      await button.click();
    }

    const urls = await page.$$eval(
      '.nfzm-list li>a',
      els => els
        .map(el => 'http://infzm.com' + el.getAttribute('href'))
        .filter(el => el.startsWith('http://infzm.com/contents/')),
    );

    return _.uniq(urls);
  }
}
