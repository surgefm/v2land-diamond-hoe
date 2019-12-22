import SiteModel from './Site';
import { Table, Column, Model, BelongsTo, Default } from 'sequelize-typescript';

@Table
class Article extends Model<Article> {
  @Column
  url: URL;

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

  @Column
  @Default('pending')
  status: string;

  @BelongsTo(() => SiteModel)
  site: SiteModel;
}

export default Article;
export { Article };
