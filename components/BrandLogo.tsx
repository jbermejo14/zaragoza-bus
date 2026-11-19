import React from 'react';
import { assetPath, SITE_NAME } from '@/lib/site';

const LOGO_WIDTH = 198;
const LOGO_HEIGHT = 48;

/** Logo de Ododex en su variante clara (la web no tiene modo oscuro). */
export function BrandLogo() {
  return (
    // SVG estático: next/image no aporta optimización y obligaría a configurar `dangerouslyAllowSVG`.
    <img
      className="brand-logo"
      src={assetPath('/brand/ododex-logo-light.svg')}
      alt={SITE_NAME}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
    />
  );
}
