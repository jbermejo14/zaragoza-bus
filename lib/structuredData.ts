import { absoluteUrl } from './site';

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

const STRUCTURED_CONTEXT = 'https://schema.org';

/** `BreadcrumbList`; las URL son rutas de la web y se convierten en absolutas. */
export function breadcrumbJsonLd(items: BreadcrumbEntry[]): Record<string, unknown> {
  return {
    '@context': STRUCTURED_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}
