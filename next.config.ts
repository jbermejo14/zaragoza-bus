import type { NextConfig } from 'next';

// Ruta bajo la que se publica la web dentro de ododex.com. Debe coincidir con
// BASE_PATH de lib/site.ts (lo comprueba tests/site.test.ts).
const BASE_PATH = '/es/zaragoza-bus';

// Exportación estática: la app es solo cliente. Los tiempos de paso se piden al
// servidor de Ododex (mismo origen) y el listado de postes, a la API municipal.
const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
