import { Page } from 'puppeteer';
import mkdir from './mkdir';
import * as path from 'path';

export default async function takeScreenShot(page: Page, filename: string): Promise<[Buffer, string]> {
  const snapshotsDir = path.join(__dirname, '../../../snapshots');
  await mkdir(snapshotsDir);
  const p = path.join(snapshotsDir, `${filename}.jpeg`);

  return [await page.screenshot({
    path: p,
    fullPage: true,
    type: 'jpeg',
    quality: 90,
  }), p];
}
