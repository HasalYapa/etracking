/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly set the app directory to false for the conflicting routes
  experimental: {
    appDir: false,
  },
  // Redirect conflicting routes from app to pages
  async redirects() {
    return [
      {
        source: '/driver-dashboard',
        destination: '/driver-dashboard',
        permanent: true,
      },
      {
        source: '/driver-login',
        destination: '/driver-login',
        permanent: true,
      },
      {
        source: '/minimal-driver',
        destination: '/minimal-driver',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
