import type { NextConfig } from 'next';

// Serwist runs as an external post-build step (configurator mode — the only
// Turbopack-compatible setup): see serwist.config.js + the build script.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
