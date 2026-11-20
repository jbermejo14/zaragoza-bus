import type { Metadata } from 'next';
import PanelFooter from '@/components/PanelFooter';
import ZaraBusApp from '@/components/ZaraBusApp';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
};

export default function Page() {
  return (
    <main>
      <ZaraBusApp panelFooter={<PanelFooter />} />
    </main>
  );
}
