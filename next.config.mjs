/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['assemblyai'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dbviya1rj/image/upload/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  turbopack: {
    root: '/Users/archerterminez/Desktop/REPOSITORY/bob-ags-nextjs-backup',
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/ctm/agents',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/ctm/agents/groups',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/users/permissions',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/api/auth/session',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache' },
        ],
      },
    ]
  },
}

export default nextConfig
