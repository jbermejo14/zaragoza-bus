import React from 'react';
import { assetPath, SITE_NAME } from '@/lib/site';

const LOGO_WIDTH = 198;
const LOGO_HEIGHT = 48;

interface BrandLogoProps {
  /** Clases del logo (tamaño); por defecto el de la cabecera de las páginas legales. */
  className?: string;
}

/** Logo de Ododex en sus dos variantes; el CSS muestra la del tema activo (`display: none` en la otra). */
export function BrandLogo({ className = 'brand-logo' }: BrandLogoProps) {
  return (
    <>
      {/* SVG estático: next/image no aporta optimización y obligaría a configurar `dangerouslyAllowSVG`. */}
      <img
        className={`${className} brand-logo-light`}
        src={assetPath('/brand/ododex-logo-light.svg')}
        alt={SITE_NAME}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
      />
      <img
        className={`${className} brand-logo-dark`}
        src={assetPath('/brand/ododex-logo-dark.svg')}
        alt={SITE_NAME}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
      />
    </>
  );
}
