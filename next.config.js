/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, 
  },
  transpilePackages: ['@monaco-editor/react', 'jszip', 'jszip-utils']
};

module.exports = nextConfig;
