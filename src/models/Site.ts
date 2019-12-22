import { Table, Column, Model, HasMany } from 'sequelize-typescript';
import Article from './Article';

@Table({
  tableName: 'site',
})
class Site extends Model<Site> {
  @Column
  name: string;

  @Column
  domains: string[];

  @HasMany(() => Article)
  articles: Article[];
}

export default Site;
export { Site };
