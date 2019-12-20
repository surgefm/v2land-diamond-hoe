import Article from './Article';
import Site from './Site';

export abstract class Crawler {
  abstract site: Site;

  abstract crawlArticle(url: URL): Promise<Article>;
  abstract getArticleList(): Promise<URL[]>;
}

export default Crawler;
