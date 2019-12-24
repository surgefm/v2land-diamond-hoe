import { Page } from 'puppeteer';
import mkdir from './mkdir';
import * as path from 'path';

export default async function takeScreenShot(page: Page, filename: string): Promise<Buffer> {
  const snapshotsDir = path.join(__dirname, '../../../snapshots');
  await mkdir(snapshotsDir);

  return page.screenshot({
    path: path.join(snapshotsDir, `${filename}.jpeg`),
    fullPage: true,
    type: 'jpeg',
    quality: 90,
  });
}
