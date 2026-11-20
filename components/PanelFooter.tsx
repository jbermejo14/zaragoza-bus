import React from 'react';
import AboutSection from './AboutSection';
import { BrandLogo } from './BrandLogo';
import { FooterContent } from './Footer';

const PANEL_LOGO_CLASSES = 'brand-logo h-7 w-auto';

/**
 * Final del panel: «Sobre este servicio» y el pie de Ododex. Es un componente de servidor porque
 * `NetworkFooterLinks` lee un fichero del disco; llega ya pintado al panel cliente como `ReactNode`.
 */
export default function PanelFooter() {
  return (
    <>
      <AboutSection />
      <footer className="panel-footer">
        {/* Enlace a la portada de ododex.com: `<a>` y no `Link`, que añadiría la ruta base de la sección. */}
        <a href="/" className="w-fit">
          <BrandLogo className={PANEL_LOGO_CLASSES} />
        </a>
        <FooterContent />
      </footer>
    </>
  );
}
