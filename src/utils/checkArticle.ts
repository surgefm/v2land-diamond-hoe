import { ArticleObj } from '@Types';
import { Article } from '@Models';

async function checkArticle(article: ArticleObj): Promise<[Article, boolean]> {
  const [a, created] = await Article.findOrCreate({
    where: { url: article.url },
    defaults: {
      status: 'ongoing',
      siteId: article.site.id,
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
