import { Sequelize } from 'sequelize-typescript';
import { Article, Site } from '@Models';
import { dbConfig } from '@Config';

export default async function (): Promise<void> {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    models: [Article, Site],
    ...dbConfig,
  });

  await sequelize.authenticate();
  await sequelize.sync();

  global.sequelize = sequelize;
}
