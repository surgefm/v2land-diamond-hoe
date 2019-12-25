import { SiteObj } from '@Types';
import { Site } from '@Models';

async function getOrCreateSite(site: SiteObj): Promise<Site> {
  const [s, created] = await Site.findOrCreate({
    where: { name: site.name },
    defaults: { domains: site.domains },
  });

  // A lot of unverified assumptions going on here.
  if (!created && site.domains.length != s.domains.length) {
    s.domains = site.domains;
    await s.save();
  }

  return s;
}

export default getOrCreateSite;
