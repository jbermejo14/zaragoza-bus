import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import { SECTION_NAME } from '@/lib/site';

/** Cabecera de Ododex de las páginas legales y la 404: logo, nombre de la sección y botón de tema. */
export function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link href="/" className="brand">
          <BrandLogo />
          <span className="brand-separator" aria-hidden="true" />
          <span className="brand-section">{SECTION_NAME}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
