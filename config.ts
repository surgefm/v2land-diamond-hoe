export const puppeteerConfig = {
  navigationTimeout: 120000,
  maxPageCount: 20,
  maxSitePageCount: 5,
};

export const crawlerConfig = {
  takeScreenshot: process.env.CRAWLER_SCREENSHOT !== '0',
  interval: typeof process.env.CRAWLER_INTERVAL === 'undefined'
    ? 15 * 60 * 1000
    : +process.env.CRAWLER_INTERVAL,
};

export const dbConfig = {
  database: process.env.DB_NAME || 'v2land',
  host: process.env.DB_HOST || '127.0.0.1',
  username: process.env.DB_USERNAME || 'v2land',
  password: process.env.DB_PASSWORD,
};

export const s3Config = {
  bucket: process.env.S3_BUCKET,
};

export const proxyCrawlerConfig = {
  interval: typeof process.env.PROXY_CRAWLER_INTERVAL === 'undefined'
    ? 60 * 60 * 1000
    : +process.env.PROXY_CRAWLER_INTERVAL,
};
