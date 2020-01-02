import { ProxyCrawler, Proxy, ProxyRegion, ProxyType } from '@Types';
import { Page } from 'puppeteer';

enum PLPProxyTypes {
  HTTP = 'https://list.proxylistplus.com/Fresh-HTTP-Proxy-List-',
  HTTPS = 'https://list.proxylistplus.com/SSL-List-',
  SOCKS = 'https://list.proxylistplus.com/Socks-List-',
}

export class ProxyListPlusProxyCrawler extends ProxyCrawler {
  name = 'ProxyListPlus';

  async crawlProxies(): Promise<Proxy[]> {
    const page = await global.puppeteerPool.acquire();

    let proxies: Proxy[] = [];
    try {
      for (const type of Object.values(PLPProxyTypes)) {
        proxies = proxies.concat(await this.crawlProxiesOfType(page, type, 1));
      }
    } catch (err) {}
    finally {
      await global.puppeteerPool.destroy(page);
    }

    return proxies;
  }

  async crawlProxiesOfType(page: Page, type: PLPProxyTypes, pageNumber: number): Promise<Proxy[]> {
    await page.goto(`${type}${pageNumber}`, { waitUntil: 'networkidle2' });
    const rows = await page.$$eval(
      'table>tbody>tr.cells',
      els => els
        .filter(el => el.childElementCount === 8)
        .map(el => [...el.children].map(e => e.textContent)),
    );

    let proxies = rows.map(el => {
      let proxyType = ProxyType.HTTP;
      if (type === PLPProxyTypes.HTTPS) {
        proxyType = ProxyType.HTTPS;
      } else if (type === PLPProxyTypes.SOCKS) {
        proxyType = el[3] === 'Socks5' ? ProxyType.SOCKS5 : ProxyType.SOCKS4;
      }

      const proxy: Proxy = {
        address: el[1].trim(),
        port: +el[2].trim(),
        region: ProxyRegion.oversea,
        type: proxyType,
      };

      return proxy;
    });

    const maxPage = await page.$eval('.cells>td>select>option:last-child', el => +el.textContent);
    if (pageNumber < maxPage) {
      proxies = proxies.concat(await this.crawlProxiesOfType(page, type, pageNumber + 1));
    }

    return proxies;
  }
}
