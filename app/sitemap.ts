import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Con `output: 'export'` el sitemap debe declararse estático para generarse en el build.
export const dynamic = 'force-static';

/** Solo la portada: las páginas legales son noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl('/') }];
}
