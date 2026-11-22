import type { Metadata } from 'next';
import PanelFooter from '@/components/PanelFooter';
import ZaraBusApp from '@/components/ZaraBusApp';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
};

const WEB_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Autobús de Zaragoza en tiempo real',
  url: absoluteUrl('/'),
  applicationCategory: 'TravelApplication',
  operatingSystem: 'All',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  provider: {
    '@type': 'Organization',
    name: 'Ododex',
    url: 'https://ododex.com',
  },
  description:
    'Consulta cuándo llega el próximo autobús urbano de Zaragoza a tu parada en tiempo real: postes, líneas de Avanza Zaragoza, mapa interactivo y llegadas estimadas.',
};

export default function Page() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEB_APPLICATION_SCHEMA) }}
      />
      <ZaraBusApp panelFooter={<PanelFooter />} />
    </main>
  );
}
