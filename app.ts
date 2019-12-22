import * as Koa from 'koa';
import * as Router from 'koa-router';

import * as logger from 'koa-logger';
import * as json from 'koa-json';

import initializePuppeteerPool from './src/puppeteerPool';
import initializeSequelize from './src/sequelize';

async function init(): Promise<void> {
  await initializePuppeteerPool();
  await initializeSequelize();

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
