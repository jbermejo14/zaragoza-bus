import type { Metadata } from 'next';
import AboutSection from '@/components/AboutSection';
import ZaraBusApp from '@/components/ZaraBusApp';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
};

export default function Page() {
  return (
    <main>
      <ZaraBusApp />
      <AboutSection />
    </main>
  );
}
