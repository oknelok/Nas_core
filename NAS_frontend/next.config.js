/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Allow Jest (via next/jest) to transform these ESM-only packages used in tests
  transpilePackages: [
    'msw',
    'rettime',
    '@mswjs/interceptors',
    'until-async',
    '@inquirer/ansi',
    '@inquirer/figures',
    '@inquirer/type',
    'psl',
  ],
}

module.exports = nextConfig
