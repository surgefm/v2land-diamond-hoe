import Article from '@Models/Article';
import SiteObj from './SiteObj';
import { Page } from 'puppeteer';

export abstract class Crawler {
  abstract site: SiteObj;

  // return [article, crawledSuccessfully]
  abstract crawlArticle(page: Page, url: string): Promise<[Article, boolean]>;
  abstract getArticleList(page: Page): Promise<string[]>;
}

export default Crawler;
