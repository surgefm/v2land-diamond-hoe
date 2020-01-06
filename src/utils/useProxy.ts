import { Page } from 'puppeteer';
import { Proxy } from '@Types';
const puppeteerPageProxy = require('puppeteer-page-proxy');

async function useProxy(page: Page, proxy: Proxy): Promise<Page> {
  if (!proxy) return;
  await puppeteerPageProxy(page, proxy.href);
  return page;
}

export default useProxy;
