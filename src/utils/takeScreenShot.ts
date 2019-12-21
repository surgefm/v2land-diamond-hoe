import { Page } from 'puppeteer';
import * as path from 'path';

export default async function takeScreenShot(page: Page, filename: string): Promise<Buffer> {
  return page.screenshot({
    path: path.join(__dirname, '../snapshots', `${filename}.jpeg`),
    fullPage: true,
    type: 'jpeg',
    quality: 90,
  });
}
