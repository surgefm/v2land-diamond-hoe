import { Site } from '@Models';

interface ArticleObj {
  url: string;
  site: Site;
  title?: string;
  content?: string;
  abstract?: string;
  source?: string;
  sourceUrl?: string;
  time?: Date;
  html?: string;
  screenshot?: string;
  status?: string;
}

export default ArticleObj;
