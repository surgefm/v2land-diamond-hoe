export const puppeteerConfig = {
  headless: typeof process.env.HEADLESS === 'undefined' ? true : process.env.HEADLESS !== '0',
};

export const crawlerConfig = {
  takeScreenshot: typeof process.env.CRAWLER_SCREENSHOT === 'undefined'
    ? true
    : process.env.CRAWLER_SCREENSHOT !== '0',
};

export const dbConfig = {
  database: process.env.DB_NAME || 'v2land',
  host: process.env.DB_HOST || '127.0.0.1',
  username: process.env.DB_USERNAME || 'v2land',
  password: process.env.DB_PASSWORD,
};
