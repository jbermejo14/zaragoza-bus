import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'ZaraBus — Autobuses de Zaragoza en tiempo real',
  description:
    'Consulta en tiempo real cuándo llega el próximo autobús urbano de Zaragoza a tu parada: busca por número de poste o por calle.',
};

export const viewport: Viewport = {
  themeColor: '#DC2626',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
