import Article from '../models/Article';
import SiteObj from './SiteObj';
import { Page } from 'puppeteer';

export abstract class Crawler {
  abstract site: SiteObj;

  abstract crawlArticle(page: Page, url: string): Promise<Article>;
  abstract getArticleList(page: Page): Promise<string[]>;
}

export default Crawler;
