import { Site } from '../models';

interface ArticleObj {
  url: string;
  site: Site;
  title?: string;
  content?: string;
  abstract?: string;
  time?: Date;
  html?: string;
  screenshot?: string;
  status?: string;
}

export default ArticleObj;
