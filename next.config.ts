import type { NextConfig } from 'next';

// Exportación estática: la app es solo cliente y consume la API municipal
// directamente desde el navegador (la API responde con Access-Control-Allow-Origin: *).
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
