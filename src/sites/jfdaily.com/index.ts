import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page } from 'puppeteer';
import * as _ from 'lodash';

export const jfdaily: SiteObj = {
  name: '解放日报',
  domains: ['www.jfdaily.com'],
};

export class QdailyComCrawler extends Crawler {
  site = jfdaily;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(jfdaily, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      article.html = await page.content();
      article.title = await page.$eval('.wz_contents', el => el.textContent.trim());
      article.abstract = await page.$eval('.wz_contents1', el => el.childNodes[1].childNodes[2].textContent.trim());
      article.source = null;
      article.sourceUrl = null;
      article.content = await page.$eval(
        '#newscontents',
        el => Array.from(el.childNodes).map(x => x.textContent.trim()).join('\n'),
      );
      article.time = new Date(await page.$eval('.fenxiang_zz', el => el.childNodes[4].textContent.trim()));

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    const pageLimit = 5;
    const sectionCodes = [42, 1, 2, 35, 22, 4, 21, 41];

    var urlPaths: string[] = [];
    for(let sectionCode of sectionCodes) {
      for(let pageNumber = 1; pageNumber <= pageLimit; ++pageNumber) {
        let pageUrl = `https://www.jfdaily.com/news/list?section=${sectionCode}&page=${pageNumber}`; 
        await page.goto(pageUrl, { waitUntil: 'networkidle2' });

        urlPaths = urlPaths.concat(
          await page.$$eval('.chengshi_wz_h>a', els => els.map(el => el.getAttribute('href')))
        );
      }
    }

    return urlPaths.map(path => 'https://www.jfdaily.com' + path);
  }

}
