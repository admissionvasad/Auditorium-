/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_PROXY_TARGET || 'http://localhost:4001'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
