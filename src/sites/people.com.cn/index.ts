import { SiteObj, Crawler } from '@Types';
import { Article } from '@Models';
import { safe, checkArticleWithURL } from '@Utils';
import { Page, ElementHandle } from 'puppeteer';
import delay from 'delay';
import * as _ from 'lodash';

export const peopleComCn: SiteObj = {
  name: '人民网',
  domains: [
    'news.people.com.cn',
    'politics.people.com.cn',
    'world.people.com.cn',
    'finance.people.com.cn',
    'tw.people.com.cn',
    'military.people.com.cn',
    'opinion.people.com.cn',
    'leaders.people.com.cn',
    'tv.people.com.cn',
    'renshi.people.com.cn',
    'theory.people.com.cn',
    'legal.people.com.cn',
    'society.people.com.cn',
    'industry.people.com.cn',
    'edu.people.com.cn',
    'kpzg.people.com.cn',
    'sports.people.com.cn',
    'culture.people.com.cn',
    'art.people.com.cn',
    'house.people.com.cn',
    'auto.people.com.cn',
    'health.people.com.cn',
    'scitech.people.com.cn',
    'bj.people.com.cn',
    'tj.people.com.cn',
    'he.people.com.cn',
    'sx.people.com.cn',
    'nm.people.com.cn',
    'ln.people.com.cn',
    'jl.people.com.cn',
    'hlj.people.com.cn',
    'sh.people.com.cn',
    'js.people.com.cn',
    'zj.people.com.cn',
    'ah.people.com.cn',
    'fj.people.com.cn',
    'jx.people.com.cn',
    'sd.people.com.cn',
    'henan.people.com.cn',
    'hb.people.com.cn',
    'hn.people.com.cn',
    'gd.people.com.cn',
    'gx.people.com.cn',
    'hi.people.com.cn',
    'cq.people.com.cn',
    'sc.people.com.cn',
    'gz.people.com.cn',
    'yn.people.com.cn',
    'xz.people.com.cn',
    'sn.people.com.cn',
    'gs.people.com.cn',
    'qh.people.com.cn',
    'nx.people.com.cn',
    'xj.people.com.cn',
    'sz.people.com.cn',
    'www.rmxiongan.com',
    'en.people.cn',
    'j.people.com.cn',
    'french.peopledaily.com.cn',
    'spanish.peopledaily.com.cn',
    'russian.people.com.cn',
    'arabic.people.com.cn',
    'kr.people.com.cn',
    'german.people.com.cn',
    'portuguese.people.com.cn',
    'mongol.people.com.cn',
    'tibet.people.com.cn',
    'uyghur.people.com.cn',
    'kazakh.people.com.cn',
    'korean.people.com.cn',
    'yi.people.com.cn',
    'sawcuengh.people.com.cn',
    'pic.people.com.cn',
    'dangjian.people.com.cn',
    'dangshi.people.com.cn',
    'fanfu.people.com.cn',
    'hm.people.com.cn',
    'media.people.com.cn',
    'book.people.com.cn',
    'rmfp.people.com.cn',
    'ccnews.people.com.cn',
    'fangtan.people.com.cn',
    'tc.people.com.cn',
    'homea.people.com.cn',
    'it.people.com.cn',
    'capital.people.com.cn',
    'yuqing.people.com.cn',
    'mooc.people.com.cn',
    'blockchain.people.com.cn',
    'ydyl.people.com.cn',
    'money.people.com.cn',
    'money.people.com.cnstock',
    'energy.people.com.cn',
    'gongyi.people.com.cn',
    'env.people.com.cn',
    'hongmu.people.com.cn',
    'jiaju.people.com.cn',
    'dengshi.people.com.cn',
    'shipin.people.com.cn',
    'jiu.people.cn',
    'fashion.people.com.cn',
    'ent.people.com.cn',
    'game.people.com.cn',
    'caipiao.people.com.cn',
    'travel.people.com.cn',
    'country.people.com.cn',
    'ip.people.com.cn',
    'japan.people.com.cn',
  ],
};

export class PeopleComCnCrawler extends Crawler {
  site = peopleComCn;

  async crawlArticle(page: Page, url: string): Promise<[Article, boolean]> {
    const [article, proceed] = await checkArticleWithURL(peopleComCn, url);
    if (!proceed) return [article, false];

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      article.html = await page.content();
      article.title = await page.$eval('div.text_title h1', el => el.textContent);
      article.abstract = await safe(page.$eval('meta[name=description]', el => el.getAttribute('content')));
      article.content = await page.$$eval(
        'div.box_con p',
        els => els.map(el => el.textContent.trim()).join('\n'),
      );
      const timeStr = await page.$eval('div.box01 div.fl', el => el.textContent.split(' ')[0]);
      article.time = new Date(timeStr.replace('年', '-').replace('月', '-').replace('日', ' ') + ' GMT+8');
      article.source = await safe(page.$eval('meta[name=source]', el => el.getAttribute('content').slice(3)));

      return [await article.save(), true];
    } catch (err) {
      article.status = 'pending';
      return [await article.save(), false];
    }
  }

  async getArticleList(page: Page): Promise<string[]> {
    let urls: string[] = [];
    await page.goto('http://news.people.com.cn/', { waitUntil: 'networkidle2' });

    await page.click('div.box_right div.tools input[value="30条"]');

    const categories = await page.$$('div.cate_list ul li input');
    for (const category of categories) {
      const checked = await category.evaluate(c => c.getAttribute('checked')) !== null;
      if (checked) {
        await category.click();
      }
    }

    async function getNextButton(): Promise<ElementHandle<Element>> {
      await delay(500);
      const nextButton = await page.$('#Pagination .next');
      if (nextButton !== null) return nextButton;
      return getNextButton();
    }

    for (const category of categories) {
      await category.click();

      while (true) {
        const nextButton = await getNextButton();

        const results = await page.$$eval(
          '#Searchresult ul li a',
          els => els.map(el => el.getAttribute('href')),
        );
        urls = [...urls, ...results];

        const end = await nextButton.evaluate(el => el.classList.contains('current'));
        if (end) break;
        await nextButton.click();
      }

      await category.click();
    }

    urls = _.uniq(urls);

    return urls;
  }
}
