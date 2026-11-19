import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const SITE_TITLE = 'Autobús de Zaragoza en tiempo real: cuándo llega tu bus';
const SITE_DESCRIPTION =
  'Consulta cuándo llega el próximo autobús urbano de Zaragoza a tu parada: busca por número de poste o por calle, mira el mapa y guarda tus paradas favoritas.';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-surface font-sans text-ink antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
