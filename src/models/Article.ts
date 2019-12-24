import Site from './Site';
import { Table, Column, Model, Default, DataType, ForeignKey } from 'sequelize-typescript';

@Table({
  tableName: 'articles',
})
class Article extends Model<Article> {
  @Column(DataType.STRING)
  url: string;

  @Column
  title?: string;

  @Column
  content?: string;

  @Column
  abstract?: string;

  @Column
  time?: Date;

  @Column
  html?: string;

  @Column
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
