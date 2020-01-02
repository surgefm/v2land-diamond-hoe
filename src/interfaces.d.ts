/* eslint-disable no-unused-vars */
import { Pool } from 'generic-pool';
import { Page } from 'puppeteer';
import { Sequelize } from 'sequelize-typescript';
import { Crawler, Proxy } from '@Types';
import { S3 } from 'aws-sdk';

declare global {
  namespace NodeJS {
    interface Global {
      puppeteerPool: Pool<Page>;
      sequelize: Sequelize;
      crawlers: Crawler[];
      domainToCrawlerMap: Record<string, Crawler>;
      s3: S3;
      proxies: Proxy[];
    }
  }
}
