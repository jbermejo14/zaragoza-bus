import type { Metadata } from 'next';
import AboutSection from '@/components/AboutSection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import SiteShell from '@/components/SiteShell';
import { absoluteUrl } from '@/lib/site';

const RUTA = '/sobre-el-servicio';

export const metadata: Metadata = {
  title: 'Sobre este servicio',
  description: 'Qué hace el servicio, de dónde salen los datos de paradas, tiempos y autobuses, y sus límites.',
  alternates: { canonical: absoluteUrl(RUTA) }
};

export default function SobreElServicioPage() {
  return (
    <SiteShell>
      <main className="main-wrapper">
        <Breadcrumbs
          items={[
            { name: 'Inicio', url: '/' },
            { name: 'Sobre el servicio', url: RUTA }
          ]}
        />
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Sobre este servicio</h1>
        <AboutSection />
      </main>
    </SiteShell>
  );
}
