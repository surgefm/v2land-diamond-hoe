import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL } from '@Utils';
import { Page } from 'puppeteer';

const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) MicroMessenger/2' +
  '.3.29(0x12031d11) MacWechat Chrome/39.0.2171.95 Safari/53' +
  '7.36 NetType/WIFI WindowsWechat';

export const mpWeixinQQCom: SiteObj = {
  name: '微信公众号',
  domains: ['mp.weixin.qq.com'],
};

export class MpWeixinQQComCrawler extends Crawler {
  site = mpWeixinQQCom;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(mpWeixinQQCom, url);
    if (!proceed) return [article, false];

    try {
      await page.setUserAgent(ua);
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('h2.rich_media_title', el => el.textContent.trim());
      article.content = await page.$$eval(
        'div.rich_media_content p',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );
      article.source = await page.$eval(
        'meta[property="og:article:author"]',
        el => el.getAttribute('content'),
      );

      const timeStrKeyword = 'if(window.__second_open__)return;';
      const timeIndex = article.html.indexOf(timeStrKeyword) + timeStrKeyword.length + 23;
      const timeStr = article.html.slice(timeIndex, timeIndex + 10);
      article.time = new Date(1e3 * (+timeStr));

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }
}
