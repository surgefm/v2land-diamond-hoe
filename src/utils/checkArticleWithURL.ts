import checkArticle from './checkArticle';
import { SiteObj, ArticleObj } from '../types';
import findOrCreateSite from './findOrCreateSite';
import { Article } from '../models';

async function checkArticleWithURL(site: SiteObj, url: string): Promise<[Article, boolean]> {
  let articleObj: ArticleObj = {
    site: await findOrCreateSite(site),
    url,
  };

  return checkArticle(articleObj);
}

export default checkArticleWithURL;
