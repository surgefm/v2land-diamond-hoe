import Site from './Site';
import { Table, Column, Model, Default, DataType, ForeignKey } from 'sequelize-typescript';

@Table({
  tableName: 'articles',
  freezeTableName: true,
})
class Article extends Model<Article> {
  @Column(DataType.TEXT)
  url: string;

  @Column(DataType.TEXT)
  title?: string;

  @Column(DataType.TEXT)
  content?: string;

  @Column(DataType.TEXT)
  abstract?: string;

  @Column(DataType.TEXT)
  source?: string;

  @Column
  time?: Date;

  @Column(DataType.TEXT)
  html?: string;

  @Column(DataType.TEXT)
  screenshot?: string;

  @Default('pending')
  @Column
  status: string;

  @ForeignKey(() => Site)
  @Column
  siteId: number
}

export default Article;
export { Article };
