import { ArticleObj } from '@Types';
import { Article } from '@Models';

async function checkArticle(
  article: ArticleObj,
  dontCreateNewArticle: boolean = false): Promise<[Article, boolean]> {
  let a, created;
  if (dontCreateNewArticle) {
    created = false;
    a = await Article.findOne({ where: { url: article.url }});
  } else {
    [a, created] = await Article.findOrCreate({
      where: { url: article.url },
      defaults: {
        status: 'ongoing',
        siteId: article.site.id,
      },
    });
  }

  if (a === null) return [null, true];

  if (!created && ['ongoing', 'crawled'].includes(a.status)) {
    return [a, false];
  } else if (!created) {
    a.status = 'ongoing';
    await a.save();
  }

  return [a, true];
}

export default checkArticle;
