import * as puppeteer from 'puppeteer';

async function cleanPageStyle(page: puppeteer.Page): Promise<void> {
  const changes: Record<string, Record<string, string>>[] = [
    { '*': { backgroundColor: 'transparent' } },
    { 'html': { backgroundColor: '#fff' } },
    { 'p,a,span,b': { color: '#333' } },
    { 'h1,h2,h3,h4,h5,h6': { color: '#00f' } },
  ];

  for (const change of changes) {
    const selector: string = Object.keys(change)[0];
    const attr: string = Object.keys(change[selector])[0];
    await page.$$eval(
      selector,
      (elSet, attr, value) => elSet.map(el => {
        el.setAttribute(
          'style',
          `${el.getAttribute('style') || ''};${attr}: ${value}`,
        );
      }),
      attr,
      change[selector][attr],
    );
  }
}

export default cleanPageStyle;
