import { Sequelize } from 'sequelize-typescript';
import { Article, Site } from './models';

export default async function (): Promise<void> {
  const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'v2land',
    dialect: 'postgres',
    username: process.env.DB_USERNAME || 'v2land',
    password: process.env.DB_PASSWORD,
    models: [Article, Site],
  });

  global.sequelize = sequelize;
}
