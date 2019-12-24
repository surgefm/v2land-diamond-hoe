import { Crawler } from '../types';
import initializeCrawlerManager from '../crawlerManager';

// Assuming global.crawlers has been initialized.
async function getCrawler(domain: string): Promise<Crawler> {
  if (typeof global.crawlers === 'undefined') {
    await initializeCrawlerManager(false);
  }

  for (const crawler of global.crawlers) {
    if (crawler.site.domains.includes(domain)) {
      return crawler;
    }
  }
}

export default getCrawler;
