import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  outputFileTracingRoot: path.join(__dirname, '../..'),
  turbopack: {
    // Cloudflare Pages では `node_modules` がモノレポ直下に置かれるため、
    // Turbopack にリポジトリルートを明示する
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
