import Site from './Site';
import {
  Table,
  Column,
  Model,
  Default,
  DataType,
  ForeignKey,
  BeforeUpdate,
  BeforeCreate,
} from 'sequelize-typescript';

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

  @Column(DataType.TEXT)
  sourceUrl?: string;

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
  siteId: number;

  @BeforeUpdate
  @BeforeCreate
  static trimText(article: Article): void {
    // this will be called when an article is created or updated
    for (const field of ['title', 'abstract', 'source', 'content']) {
      const value = (article as any)[field] as string;
      if (typeof value !== 'undefined' && value !== null) {
        (article as any)[field] = value.trim();
      }
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static extractAbstractIfNotProvided(article: Article): void {
    if (!article.abstract && article.content) {
      const { content } = article;
      article.abstract = content.slice(0, 200);
      if (content.length > 200) {
        article.abstract += '...';
      }
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static extractContentIfNotProvided(article: Article): void {
    if (!article.content && article.abstract) {
      article.content = article.abstract;
    }
  }
}

export default Article;
export { Article };
