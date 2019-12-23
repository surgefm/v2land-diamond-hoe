import { ArticleObj, SiteObj, Crawler } from '../../types';
import { Article } from '../../models';
import { findOrCreateSite, checkArticle } from '../../utils';
import { Page } from 'puppeteer';

export const bjNewsComCn: SiteObj = {
  name: '新京报',
  domains: ['www.bjnews.com.cn'],
};

export class BJNewsComCnCrawler extends Crawler {
  site = bjNewsComCn;

  async crawlArticle(page: Page, url: string): Promise<Article> {
    let articleObj: ArticleObj = {
      site: await findOrCreateSite(bjNewsComCn),
      url,
    };

    const [article, proceed] = await checkArticle(articleObj);
    if (!proceed) return article;

    await page.goto(url, { waitUntil: 'networkidle2' });

    article.html = await page.content();
    article.title = await page.$eval('div.title h1', el => el.textContent);
    article.abstract = await page.$eval('div.desc p.ctdesc', el => el.textContent);
    article.content = await page.$$eval(
      'div.content p',
      els => els.map(el => el.textContent).join('\n'),
    );
    const timeStr = await page.$eval('div.m_ntit span.date', el => el.textContent);
    article.time = new Date(timeStr + ' GMT+8');

    return article.save();
  }

  async getArticleList(page: Page): Promise<string[]> {
    await page.goto('http://www.bjnews.com.cn/', { waitUntil: 'networkidle2' });

    const urls = await page.$$eval(
      'div.news .fl.lnew a',
      els => els.map(el => 'http://www.bjnews.com.cn' + el.getAttribute('href')),
    );

    return urls;
  }
}
