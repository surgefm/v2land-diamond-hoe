import { Site, Article, Crawler } from '../../types/index';
import { Page } from 'puppeteer';

export const bjNewsComCn: Site = {
  name: '新京报',
  domains: ['www.bjnews.com.cn'],
};

export class BJNewsComCnCrawler extends Crawler {
  site = bjNewsComCn;

  async crawlArticle(page: Page, url: URL): Promise<Article> {
    let article: Article = {
      site: bjNewsComCn,
      url,
    };

    await page.setViewport({ width: 1024, height: 768 });
    await page.goto(url.href, { waitUntil: 'networkidle2' });

    article.html = await page.content();
    article.title = await page.$eval('div.title h1', el => el.textContent);
    article.content = await page.$$eval(
      'div.content p',
      els => els.map(el => el.textContent).join('\n'),
    );
    const timeStr = await page.$eval('div.m_ntit span.date', el => el.textContent);
    article.time = new Date(timeStr + ' GMT+8');
    article.screenshot = '123';

    return article;
  }

  async getArticleList(): Promise<URL[]> {
    return [];
  }
}
