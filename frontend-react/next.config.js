/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedOrigins: ["IP", "localhost:3000"],
  async rewrites() {
    return [
      // Проксирование API запросов на бэкенд
      {
        source: '/api/:path*',
        destination: 'http://codeduelplatform:80/api/:path*', // URL бэкенда в Docker
      },
      // Проксирование SignalR хаба
      {
        source: '/hubs/:path*',
        destination: 'http://codeduelplatform:80/hubs/:path*', // URL бэкенда в Docker
      },
    ];
  },
};

module.exports = nextConfig; 