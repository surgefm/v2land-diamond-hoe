import Article from './Article';
import {
  Table,
  Column,
  Model,
  HasMany,
  DataType,
  BeforeUpdate,
  BeforeCreate,
} from 'sequelize-typescript';

@Table({
  tableName: 'sites',
  freezeTableName: true,
})
class Site extends Model<Site> {
  @Column
  name: string;

  @Column(DataType.ARRAY(DataType.STRING))
  domains: string[];

  @HasMany(() => Article)
  articles: Article[];

  @BeforeUpdate
  @BeforeCreate
  static trimText(site: Site): void {
    if (site.name) {
      site.name = site.name.trim();
    }
  }
}

export default Site;
export { Site };
