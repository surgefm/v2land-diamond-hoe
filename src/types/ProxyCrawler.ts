import Proxy from './Proxy';

export abstract class ProxyCrawler {
  public abstract name: string;
  public abstract async crawlProxies(): Promise<Proxy[]>;
}

export default ProxyCrawler;
