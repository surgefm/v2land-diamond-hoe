import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page, ElementHandle } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const news163Com: SiteObj = {
  name: '网易新闻',
  domains: [
    'news.163.com',
    'war.163.com',
    'money.163.com',
    'tech.163.com',
  ],
};

export class News163ComCrawler extends Crawler {
  site = news163Com;

  public async init(): Promise<Crawler> {
    return super.init(2);
  }

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(news163Com, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('div.post_content_main>h1', el => el.textContent.trim());
      article.source = await safe(page.$eval('#ne_article_source', el => el.textContent.trim()));
      article.abstract = await safe(page.$eval('div.post_desc', el => el.textContent.trim()));
      article.content = await page.$$eval(
        'div.post_text p',
        els => els
          .filter(el => el.children.length === 0)
          .map(el => el.textContent.trim())
          .join('\n'),
      );
      const timeStr = await page.$eval('div.post_time_source', el => el.textContent.trim().split('　')[0]);
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('https://news.163.com/', { waitUntil: 'networkidle2' });

    let urls: string[] = await page.$$eval(
      '.mod_top_news2 a',
      els => els.map(el => el.getAttribute('href')),
    );

    async function findLoadMoreButton(): Promise<ElementHandle<Element>> {
      await delay(500);
      const container = await page.$('ul.newsdata_list');
      if (await container.evaluate(el => el.classList.contains('bgloading'))) {
        return findLoadMoreButton();
      }
      const button = await page.$('a.load_more_btn');
      if (button === null) return findLoadMoreButton();
      if (await button.evaluate(el => el.getAttribute('style') !== 'display: none;')) {
        return button;
      }
      return null;
    }

    const tabs = await page.$$('.newsdata_nav>ul>li');
    for (const tab of tabs) {
      await tab.hover();
      await delay(1000);
      for (let i = 0; i < 5; ++i) {
        const loadMoreButton = await findLoadMoreButton();
        if (loadMoreButton === null) break;
        await safe(loadMoreButton.click());
      }
      urls = urls.concat(await page.$$eval(
        `.newsdata_item.current .data_row.news_article>a,
         .newsdata_item.current .data_row.news_photoview>.news_title>h3>a`,
        els => els.map(el => el.getAttribute('href')),
      ));
    }

    return _.uniq(urls);
  }
}
