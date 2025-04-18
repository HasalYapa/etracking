/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable the App Router completely
  experimental: {
    appRouterExperiment: false,
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
