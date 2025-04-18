/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable the App Router completely
  useFileSystemPublicRoutes: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
}

module.exports = nextConfig
