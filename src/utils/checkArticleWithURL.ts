import checkArticle from './checkArticle';
import { SiteObj, ArticleObj } from '@Types';
import findOrCreateSite from './findOrCreateSite';
import { Article } from '@Models';

async function checkArticleWithURL(site: SiteObj, url: string): Promise<[Article, boolean]> {
  let articleObj: ArticleObj = {
    site: await findOrCreateSite(site),
    url,
  };

  return checkArticle(articleObj);
}

export default checkArticleWithURL;
