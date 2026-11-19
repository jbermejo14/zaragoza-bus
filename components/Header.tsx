import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { SECTION_NAME } from '@/lib/site';

/** Cabecera de Ododex: logo y nombre de la sección. Sin botón de tema (la web es solo clara). */
export function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link href="/" className="brand">
          <BrandLogo />
          <span className="brand-separator" aria-hidden="true" />
          <span className="brand-section">{SECTION_NAME}</span>
        </Link>
      </div>
    </header>
  );
}
