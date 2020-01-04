import { Page } from 'puppeteer';
import { Proxy } from '@Types';
const puppeteerPageProxy = require('puppeteer-page-proxy');

async function useProxy(page: Page, proxy: Proxy) {
  if (!proxy) return;
  return puppeteerPageProxy(page, proxy.href);
}

export default useProxy;
