import { ProxyCrawler, Proxy, ProxyRegion, ProxyType } from '@Types';

export class KuaidailiProxyCrawler extends ProxyCrawler {
  name = 'Kuaidaili 快代理';

  async crawlProxies(): Promise<Proxy[]> {
    const page = await global.puppeteerPool.acquire();

    const proxies: Proxy[] = [];
    try {
      for (let i = 1; i <= 15; i++) {
        await page.goto(`https://www.kuaidaili.com/free/inha/${i}/`, { waitUntil: 'networkidle2' });
        const rows = await page.$$eval(
          'table>tbody>tr',
          els => els.map(el => [...el.children].map(el => el.textContent.trim())),
        );
        rows.map(row => {
          const ip = row[0];
          const port = +row[1];
          proxies.push(new Proxy(ip, port, ProxyType.HTTP, ProxyRegion.mainlandChina));
        });
      }
    } catch (err) {}
    finally {
      await global.puppeteerPool.destroy(page);
    }

    return proxies;
  }
}
