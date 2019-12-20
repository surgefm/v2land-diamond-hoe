import Site from './Site';

export interface Article {
  url: URL;
  title: string;
  abstract: string;
  time: Date;
  site: Site;
  html: string;
  screenshot: string;
}

export default Article;
