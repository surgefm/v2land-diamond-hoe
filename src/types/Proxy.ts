export enum ProxyType {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  SOCKS4 = 'SOCKS4',
  SOCKS5 = 'SOCKS5',
}

export enum ProxyRegion {
  mainlandChina = 'MAINLAND_CHINA',
  oversea = 'OVERSEA',
}

export interface Proxy {
  address: string;
  port: number;
  type: ProxyType;
  region: ProxyRegion;
  latency?: number;
}

export default Proxy;
