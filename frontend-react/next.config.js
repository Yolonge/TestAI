/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ? 
      process.env.NEXT_PUBLIC_API_URL : 
      'http://codeduelplatform:80';

    return [
      // Проксирование API запросов на бэкенд
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      // Проксирование SignalR хаба
      {
        source: '/hubs/:path*',
        destination: `${apiUrl}/hubs/:path*`,
      },
    ];
  },
};

module.exports = nextConfig; 