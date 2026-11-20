import React from 'react';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { FooterContent } from './Footer';

const PANEL_LOGO_CLASSES = 'brand-logo h-7 w-auto';

/**
 * Final del panel: enlace a «Sobre este servicio» y el pie de Ododex. Es un componente de servidor porque
 * `NetworkFooterLinks` lee un fichero del disco; llega ya pintado al panel cliente como `ReactNode`.
 */
export default function PanelFooter() {
  return (
    <>
      <Link
        href="/sobre-el-servicio"
        className="flex min-h-11 w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent-text"
      >
        <Info size={14} className="shrink-0" aria-hidden="true" />
        Sobre este servicio y de dónde salen los datos
      </Link>
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
