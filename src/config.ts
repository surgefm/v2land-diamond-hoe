export const puppeteerConfig = {
  headless: typeof process.env.HEADLESS === 'undefined' ? true : process.env.HEADLESS !== '0',
};

export const crawlerConfig = {
  takeScreenshot: typeof process.env.CRAWLER_SCREENSHOT === 'undefined'
    ? true
    : process.env.CRAWLER_SCREENSHOT !== '0',
};
