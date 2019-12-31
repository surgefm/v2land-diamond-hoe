import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, removeURLQuery, safe, getCrawlerWithDomain } from '@Utils';
import { Page } from 'puppeteer';
import delay from 'delay';

export const weiboCom: SiteObj = {
  name: '新浪微博',
  domains: ['www.weibo.com', 'm.weibo.cn'],
};

export class WeiboComCrawler extends Crawler {
  site = weiboCom;
  domains = ['www.weibo.com'];

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);
    if (url.endsWith('/')) url = url.slice(0, url.length - 1);

    const Url = new URL(url);
    if (Url.pathname.slice(1).split('/').length !== 2) {
      throw new Error('This doesn’t look like a URL to a Weibo post.');
    }

    const [article, proceed] = await checkArticleWithURL(weiboCom, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await delay(1000);
      while (!page.url().startsWith(url)) {
        await delay(500);
      }

      while (typeof article.title === 'undefined' || article.title === null) {
        await delay(500);
        article.title = await safe(page.$eval('.WB_info>a:first-child', el => `@${el.textContent.trim()}的新浪微博`));
      }

      article.html = await page.content();
      article.content = await page.$$eval(
        'div[node-type="feed_list_content"]',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );
      article.abstract = article.content.slice(0, 140).trim();
      article.source = await page.$eval('.WB_info>a:first-child', el => el.textContent.trim());

      const timeStr = await page.$eval('a[node-type="feed_list_item_date"]', el => el.getAttribute('title'));
      article.time = new Date(timeStr + ' GMT+8');

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }
}

export class MWeiboCnCrawler extends Crawler {
  site = weiboCom;
  domains = ['m.weibo.cn'];

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    url = removeURLQuery(url);
    if (url.endsWith('/')) url = url.slice(0, url.length - 1);

    const Url = new URL(url);
    const pathname = Url.pathname.slice(1).split('/');
    if (pathname.length !== 2) {
      throw new Error('This doesn’t look like a URL to a Weibo post.');
    }

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await delay(1000);
      while (!page.url().startsWith('https://m.weibo.cn/')) {
        await delay(500);
      }
      await delay(3000);

      const publisherId = await safe(page.evaluate(() => (window as any).$render_data.status.user.id));
      const bid = await safe(page.evaluate(() => (window as any).$render_data.status.bid));
      if (publisherId === null || bid === null) {
        throw new Error('Unable to find the bid for the Weibo post.');
      }

      const newUrl = `https://www.weibo.com/${publisherId}/${bid}`;
      const weiboComCrawler = await getCrawlerWithDomain('www.weibo.com');
      console.log(weiboComCrawler, newUrl);
      return weiboComCrawler.crawlArticle(page, newUrl);
    } catch (err) {
      throw new Error('We are unable to retrieve information from this URL.');
    }
  }
}
