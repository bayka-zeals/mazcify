/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google profile photos
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Firebase Storage assets
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // PixVerse generated images/videos
      { protocol: 'https', hostname: '*.pixverse.ai' },
    ],
  },
  // Strict mode for catching bugs early
  reactStrictMode: true,
  // Reduce bundle size — only import what's used from lucide
  transpilePackages: ['lucide-react'],
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },
  // Lint runs in CI and locally via `npm run lint` — keep the deploy build
  // resilient to ESLint plugin resolution issues on Vercel.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
