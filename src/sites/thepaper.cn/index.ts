import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { checkArticleWithURL, safe } from '@Utils';
import { Page, ElementHandle } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const thepaperCn: SiteObj = {
  name: '澎湃新闻',
  domains: [
    'www.thepaper.cn',
  ],
};

export class ThepaperCnCrawler extends Crawler {
  site = thepaperCn;

  public async init(): Promise<Crawler> {
    return super.init(2);
  }

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(thepaperCn, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      article.url = url;
      article.html = (await page.content()).substring(0, 20000);
      article.source = null; // all thepaper news are original
      
      function extractTime(text: String): Date {
        let regExp = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/;
        let index = text.search(regExp);
        if(index > 0) {
          let timeString = text.substring(index, index + 16);
          return new Date(timeString + ' GMT+8');
        } else {
          return null;
        }   
      }

      // for video news
      if(page.$('.video_news_detail')) {
        console.log("VIDEO")
        article.title = await page.$eval('.video_txt_detail .video_txt_t h2', el => el.textContent.trim());
        console.log(article.title);
        article.abstract = await page.$eval('.video_txt_detail .video_txt_l p', el => el.textContent.trim());
        console.log(article.abstract);
        article.content = article.abstract;
        let timeHTML = await page.$eval('.video_info_first .video_info_left', el => el.innerHTML);
        article.time = extractTime(timeHTML);
        console.log(article.time);

      // for text news
      } else {
        article.title = await page.$eval('.newscontent .news_title', el => el.textContent.trim());
        console.log(article.title);
        article.abstract = null; // the abstract is not on the article page, but on the article list page
        article.content = await page.$eval(
          '.newscontent .news_txt', 
          el => Array.from(el.childNodes).map(x=>x.textContent.trim()).filter(t => t.length !== 0).join('\n')
        );
        article.content = article.content.substring(0, 20000); // cut off for SQL
        let timeHTML = await page.$eval('.newscontent .news_about', el => el.innerHTML);
        article.time = extractTime(timeHTML);
      }

      return [await article.save(), true];

    } catch (err) {
      console.log("======== ERR =========");
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    const timesOfLoadMore = 5;

    try {
      await page.goto('https://www.thepaper.cn/', { waitUntil: 'networkidle2' });

      // scroll to bottom to load more
      for (let i = 0; i < timesOfLoadMore; i++) {
        await page.keyboard.press('End');
        await page.waitForSelector('#infscr-loading', { visible: true });
        await page.waitForSelector('#infscr-loading', { hidden: true });
      }

      let paths = await page.$$eval(
        '#mainContent .newsbox .news_li>h2>a',
        els => els.map(el => el.getAttribute('href'))
      );
      let urls = paths.map(path => page.url() + path);
      return _.uniq(urls);

    } catch (err) {
      return [];
    }
  }
}
