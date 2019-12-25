import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page } from 'puppeteer';

export const newsSinaComCn: SiteObj = {
  name: '新浪新闻',
  domains: [
    'news.sina.com.cn',
    'mil.news.sina.com.cn',
    'finance.sina.com.cn',
    'tech.sina.com.cn',
    'mobile.sina.com.cn',
    'zhongce.sina.com.cn',
    'sports.sina.com.cn',
    'ent.sina.com.cn',
    'auto.sina.com.cn',
    'weather.sina.com.cn',
    'jiaju.sina.com.cn',
    'collection.sina.com.cn',
    'fashion.sina.com.cn',
    'eladies.sina.com.cn',
    'med.sina.com',
    'baby.sina.com.cn',
    'edu.sina.com.cn',
    'gongyi.sina.com.cn',
    'fo.sina.com.cn',
    'photo.sina.com.cn',
    'book.sina.com.cn',
    'tousu.sina.com.cn',
    'sifa.sina.com.cn',
    'city.sina.com.cn',
    'sh.sina.com.cn',
    'tzxy.sina.com.cn',
    'travel.sina.com.cn',
    'cul.news.sina.com.cn',
    'lottery.sina.com.cn',
    'games.sina.com.cn',
    'mail.sina.com.cn',
    'english.sina.com',
    'jiaoyi.sina.com.cn',
    'jr.sina.com.cn',
    'gov.sina.com.cn',
  ],
};

export class NewsSinaComCnCrawler extends Crawler {
  site = newsSinaComCn;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(newsSinaComCn, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('h1.main-title', el => el.textContent);
      article.abstract = await safe(page.$eval('meta[name=description]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        'div.article-content #article p',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );
      const timeStr = await page.$eval('div.date-source span.date', el => el.textContent);
      article.time = new Date(timeStr.replace('年', '-').replace('月', '-').replace('日', ' ') + ' GMT+8');
      article.source = await safe(page.$eval('div.date-source a', el => el.textContent));

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://news.sina.com.cn/', { waitUntil: 'networkidle2' });

    const urls: string[] = await page.$$eval(
      `h1[data-client=headline] a,
       p[data-client=throw] b a,
       ul[data-sudaclick*=blk_news_] li a,
       ul[data-sudaclick*=news_gn_] li a,
       ul[data-sudaclick*=news_gj_] li a,
       ul[data-sudaclick=fin_1] li a,
       ul[data-sudaclick=ent_1] li a,
       ul[data-sudaclick*=news_sh_] li a,
       div[data-sudaclick=gn2_list_01] ul li a,
       div[data-sudaclick=gj2_list_01] ul li a,
       div[data-sudaclick=mil2_list] ul li a,
       div[data-sudaclick=sports2_list] ul li a,
       div[data-sudaclick=fin2_list] ul li a,
       div[data-sudaclick=auto2_list] ul li a,
       div[data-sudaclick=tech2_list] ul li a:last-child,
       div[data-sudaclick=edu2_list] a,
       div[data-sudaclick=game2_list]>div>:not(.Tit_06) a,
       div[data-sudaclick=ent2_list]>:not(.Tit_06) a,
       div[data-sudaclick=sh2_list] ul li a,
       ul[data-sudaclick*=gn_hotnews] li a,
       ul[data-sudaclick*=gj_hotnews] li a,
       ol[data-sudaclick=fin2_hot] li a,
       ol[data-sudaclick=sh2_click01] li a`,
      els => els.map(el => el.getAttribute('href')),
    );

    return urls;
  }
}
