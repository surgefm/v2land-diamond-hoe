import Article from './Article';
import Site from './Site';
import { Page } from 'puppeteer';

export abstract class Crawler {
  abstract site: Site;

  abstract crawlArticle(page: Page, url: URL): Promise<Article>;
  abstract getArticleList(): Promise<URL[]>;
}

export default Crawler;
