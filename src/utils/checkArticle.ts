import { ArticleObj } from '../types';
import { Article } from '../models';

async function checkArticle(article: ArticleObj): Promise<[Article, boolean]> {
  const [a, created] = await Article.findOrCreate({
    where: { url: article.url.href },
    defaults: {
      status: 'ongoing',
      site: article.site,
    },
  });

  if (!created && ['ongoing', 'crawled'].includes(a.status)) {
    return [a, false];
  } else if (!created) {
    a.status = 'ongoing';
    await a.save();
  }

  return [a, true];
}

export default checkArticle;
