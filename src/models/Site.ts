import { Table, Column, Model, HasMany, DataType } from 'sequelize-typescript';
import Article from './Article';


@Table({
  tableName: 'sites',
})
class Site extends Model<Site> {
  @Column
  name: string;

  @Column(DataType.ARRAY(DataType.STRING))
  domains: string[];

  @HasMany(() => Article)
  articles: Article[];
}

export default Site;
export { Site };
