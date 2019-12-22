import { SiteObj } from '../types';
import { Site } from '../models';

async function getOrCreateSite(site: SiteObj): Promise<Site> {
  const [s] = await Site.findOrCreate({
    where: { name: site.name },
    defaults: { domains: site.domains },
  });

  return s;
}

export default getOrCreateSite;
