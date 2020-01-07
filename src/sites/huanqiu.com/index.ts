import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe, removeURLQuery } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

export const huanqiuCom: SiteObj = {
  name: '环球网',
  domains: [
    'www.huanqiu.com',
    'china.huanqiu.com',
    'i.huanqiu.com',
    'house.huanqiu.com',
    'tech.huanqiu.com',
    'finance.huanqiu.com',
    'world.huanqiu.com',
    'mil.huanqiu.com',
    'opinion.huanqiu.com',
    'oversea.huanqiu.com',
    'v.huanqiu.com',
    'smart.huanqiu.com',
    'health.huanqiu.com',
    'fashion.huanqiu.com',
    'ent.huanqiu.com',
    'go.huanqiu.com',
    'society.huanqiu.com',
    'look.huanqiu.com',
    'uav.huanqiu.com',
    'taiwan.huanqiu.com',
    'sports.huanqiu.com',
    'ski.huanqiu.com',
    'run.huanqiu.com',
    'city.huanqiu.com',
    'auto.huanqiu.com',
    'lx.huanqiu.com',
    'quality.huanqiu.com',
    'cul.huanqiu.com',
    'chamber.huanqiu.com',
    'luxury.huanqiu.com',
  ],
};

export class HuanqiuComCrawler extends Crawler {
  site = huanqiuCom;
  domains = [
    'www.huanqiu.com',
    'opinion.huanqiu.com',
    'china.huanqiu.com',
    'taiwan.huanqiu.com',
    'world.huanqiu.com',
    'smart.huanqiu.com',
    'go.huanqiu.com',
    'uav.huanqiu.com',
    'finance.huanqiu.com',
    'tech.huanqiu.com',
    'sports.huanqiu.com',
    'run.huanqiu.com',
    'ski.huanqiu.com',
    'health.huanqiu.com',
    'lx.huanqiu.com',
    'auto.huanqiu.com',
    'ent.huanqiu.com',
    'fashion.huanqiu.com',
  ];

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);
    let [article, proceed] = await checkArticleWithURL(huanqiuCom, url, true);
    if (!proceed) return [article, false];

    await page.goto(url, { waitUntil: 'networkidle2' });

    url = page.url();
    if (new URL(url).pathname.slice(1).split('/')[0] !== 'article') {
      throw new Error(`This doesn’t look like a URL to a huanqiu.com article: ${url}`);
    }

    [article, proceed] = await checkArticleWithURL(huanqiuCom, url);
    if (!proceed) return [article, false];

    try {
      article.html = await page.content();
      article.title = await page.$eval('.t-container-title h3', el => el.textContent);
      article.abstract = await safe(page.evaluate(() => (window as any).weChatShare.desc));
      article.content = await page.$$eval(
        'section[data-type="rtext"]>p:not(.pic-con)',
        els => els.map(el => el.textContent.trim()).filter(el => el.length > 0).join('\n'),
      );
      article.source = await safe(page.$eval('.metadata-info .source span', el => el.textContent.trim()));
      article.sourceUrl = await safe(page.$eval('.metadata-info .source span a', el => el.getAttribute('href')));
      const timeStr = await page.$eval('.metadata-info .time', el => el.textContent.trim());
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
