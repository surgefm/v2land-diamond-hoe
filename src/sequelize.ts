import { Sequelize } from 'sequelize-typescript';
import { Article, Site } from './models';
import { dbConfig } from '../config';

export default async function (): Promise<void> {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    models: [Article, Site],
    ...dbConfig,
  });

  global.sequelize = sequelize;
}
