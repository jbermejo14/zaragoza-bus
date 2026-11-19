import React from 'react';
import { getNetworkSections } from '@/lib/network';
import { BASE_PATH } from '@/lib/site';

const NETWORK_FOOTER_LABEL = 'Otras webs de Ododex';

/** Fila del pie « Otras webs de Ododex » con las demás secciones de la red. No pinta nada si no hay red. */
export function NetworkFooterLinks() {
  const sections = getNetworkSections(BASE_PATH);
  if (!sections || sections.length === 0) return null;
  return (
    <nav aria-label={NETWORK_FOOTER_LABEL} className="footer-legal">
      <span>{NETWORK_FOOTER_LABEL}:</span>
      {sections.map((section) => (
        <a key={section.ruta} href={section.ruta}>
          {section.nombre}
        </a>
      ))}
    </nav>
  );
}
