import React, { type ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/** Marco de las páginas con texto (legales y 404): cabecera y pie de Ododex alrededor del contenido. */
export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
