/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true, 
  },
  transpilePackages: ['@monaco-editor/react', 'jszip', 'jszip-utils']
};

module.exports = nextConfig;
