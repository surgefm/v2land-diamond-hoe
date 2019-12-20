import { Site, Article, Crawler } from '../../types/index';

export const bjNewsComCn: Site = {
  name: '新京报',
  domains: ['www.bjnews.com.cn'],
};

export class BJNewsComCnCrawler extends Crawler {
  site = bjNewsComCn;

  async crawlArticle(url: URL): Promise<Article> {
    let article: Article;
    article.site = bjNewsComCn;

    return article;
  }

  async getArticleList(): Promise<URL[]> {
    return [];
  }
}
