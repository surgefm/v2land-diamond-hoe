/* eslint-disable no-unused-vars */
import { Pool } from 'generic-pool';
import { Page } from 'puppeteer';
import { Sequelize } from 'sequelize-typescript';
import { Crawler } from '@Types';

declare global {
  namespace NodeJS {
    interface Global {
      puppeteerPool: Pool<Page>;
      sequelize: Sequelize;
      crawlers: Crawler[];
    }
  }
}
