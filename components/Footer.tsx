import React from 'react';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';
import { NetworkFooterLinks } from '@/components/NetworkLinks';

const OPENSTREETMAP_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

/** Pie de Ododex: descripción, atribuciones, carácter independiente, enlaces legales y red de webs. */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <p className="footer-text">
          <strong>{SITE_NAME}</strong> &bull; Autobús de Zaragoza: cuándo llega tu bus a cada parada.
        </p>
        <p className="footer-subtext">
          Mapa y datos de paradas © colaboradores de{' '}
          <a href={OPENSTREETMAP_COPYRIGHT_URL} target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{' '}
          (licencia ODbL 1.0). Fuentes: datos abiertos del Ayuntamiento de Zaragoza, web pública de Avanza Zaragoza y DNDzgz. Los tiempos son estimaciones del operador. {SITE_NAME} es un sitio independiente: no es una web del Ayuntamiento de Zaragoza ni de Avanza.
        </p>
        <nav aria-label="Información legal" className="footer-legal">
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
        </nav>
        <NetworkFooterLinks />
      </div>
    </footer>
  );
}
