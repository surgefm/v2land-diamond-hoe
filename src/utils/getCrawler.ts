import { Crawler } from '@Types';
import initializeCrawlerManager from '../crawlerManager';

export async function getCrawlerWithDomain(domain: string): Promise<Crawler> {
  if (typeof global.domainToCrawlerMap === 'undefined') {
    await initializeCrawlerManager(false);
  }

  return global.domainToCrawlerMap[domain] || null;
}

export async function getCrawler(url: string): Promise<Crawler> {
  const crawler = await getCrawlerWithDomain(url);
  if (crawler !== null) return crawler;

  const Url = new URL(url);
  const host = Url.hostname;
  return getCrawlerWithDomain(host);
}
