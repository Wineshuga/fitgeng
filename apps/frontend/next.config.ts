import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Next runs with this app as the working directory. The monorepo keeps one
// .env at the repo root, so load it explicitly.
const repoRoot = path.resolve(process.cwd(), '../..');
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Self-contained server bundle for a small production image. Tracing starts
  // at the repo root so the shared workspace package is included.
  output: 'standalone',
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },

  /**
   * Dev convenience: proxy /api to Express so the browser talks to one origin,
   * as it will in production (where Nginx does this instead, architecture D13).
   * Rewrites are fixed at build time, so production builds leave
   * API_PROXY_TARGET unset.
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    return target ? [{ source: '/api/:path*', destination: `${target}/api/:path*` }] : [];
  },
};

export default nextConfig;
