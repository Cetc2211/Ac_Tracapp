const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Configuración para Turbopack
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};

module.exports = nextConfig;
