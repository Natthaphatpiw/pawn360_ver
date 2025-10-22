/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com'
      }
    ]
  },
  output: 'standalone',
}

module.exports = nextConfig