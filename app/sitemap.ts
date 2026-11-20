import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Con `output: 'export'` el sitemap debe declararse estático para generarse en el build.
export const dynamic = 'force-static';

/** Portada y «Sobre este servicio»: las páginas legales son noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl('/') }, { url: absoluteUrl('/sobre-el-servicio') }];
}
