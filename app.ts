import 'source-map-support/register';
import 'module-alias/register';
import * as dotenv from 'dotenv';
dotenv.config();

import * as Koa from 'koa';
import * as Router from 'koa-router';

import * as logger from 'koa-logger';
import * as json from 'koa-json';

import initializePuppeteerPool from '@/puppeteerPool';
import initializeSequelize from '@/sequelize';
import initializeCrawlerManager from '@/crawlerManager';

async function init(): Promise<void> {
  await initializePuppeteerPool();
  await initializeSequelize();
  await initializeCrawlerManager();

  const app = new Koa();
  const router = new Router();

  app.use(json());
  app.use(logger());

  app.use(router.routes()).use(router.allowedMethods());

  app.listen(3000, () => {
    console.log('Koa started');
  });
}

init();
