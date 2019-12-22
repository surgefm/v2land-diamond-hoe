import Article from '../models/Article';
import SiteObj from './SiteObj';
import { Page } from 'puppeteer';

export abstract class Crawler {
  abstract site: SiteObj;

  abstract crawlArticle(page: Page, url: URL): Promise<Article>;
  abstract getArticleList(page: Page): Promise<URL[]>;
}

export default Crawler;
