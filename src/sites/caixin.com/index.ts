import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe, removeURLQuery } from '@Utils';
import { Page } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const caixinCom: SiteObj = {
  name: '财新',
  domains: [
    'www.caixin.com',
    'caixin.com',
    'm.caixin.com',
    'economy.caixin.com',
    'finance.caixin.com',
    'china.caixin.com',
    'international.caixin.com',
    'opinion.caixin.com',
    'culture.caixin.com',
    'weekly.caixin.com',
    'science.caixin.com',
    'companies.caixin.com',
    'cnreform.caixin.com',
    'en.caixin.com',
  ],
};

export class CaixinComCrawler extends Crawler {
  site = caixinCom;
  domains = _.without(caixinCom.domains, 'm.caixin.com');

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);

    const [article, proceed] = await checkArticleWithURL(caixinCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content'));
      article.abstract = await safe(page.$eval('meta[property="og:description"]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        '#Main_Content_Val>p',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );

      let sourceText = await safe(page.$eval('#artInfo>a', el => el.textContent.trim()));
      if (sourceText !== null) {
        if (sourceText.startsWith('《') && sourceText.endsWith('》')) {
          sourceText = sourceText.slice(1, sourceText.length - 1);
        }
        article.source = sourceText;
      }

      const timeStr = await page.$eval('#artInfo', el => el.textContent.trim());
      let finalTimeStr = null;
      const fullTimeStr = timeStr.match(/([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日 ([0-9]{1,2}):([0-9]{1,2})/);
      if (fullTimeStr !== null) {
        finalTimeStr = fullTimeStr[0] + ' GMT+8';
      } else {
        const halfTimeStr = timeStr.match(/([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日/);
        if (halfTimeStr !== null) {
          finalTimeStr = halfTimeStr[0] + ' GMT+8';
        }
      }

      if (finalTimeStr !== null) {
        article.time = new Date(finalTimeStr.replace('年', '-').replace('月', '-').replace('日', ''));
      }

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://www.caixin.com/?HOLDZH', { waitUntil: 'networkidle2' });

    async function loadMore(): Promise<void> {
      await delay(500);
      const button = await page.$('#moreArticle a');
      if (await button.evaluate(el => el.textContent.trim() === '加载更多文章')) {
        await button.click();
        for (let j = 0; j < 10; ++j) {
          await delay(500);
          if (await button.evaluate(el => el.textContent.trim() === '加载更多文章')) {
            return;
          }
        }
        return;
      }
      return loadMore();
    }

    for (let i = 0; i < 10; ++i) {
      await loadMore();
    }

    await page.evaluate(domains => (window as any).caixinDomains = domains, this.domains);

    const urls = await page.$$eval(
      'a',
      els => els
        .map(el => el.getAttribute('href'))
        .filter(el => {
          if (!el.endsWith('.html')) return false;
          const Url = new URL(el);

          if (Url.pathname.slice(1).split('/').length !== 2) return false;

          const domain = Url.hostname;
          return (window as any).caixinDomains.includes(domain);
        }),
    );

    return _.uniq(urls);
  }
}
