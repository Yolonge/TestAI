/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Явно указываем, что приложение должно слушать все интерфейсы
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Настройка для корректной работы с внешними запросами
  assetPrefix: process.env.NODE_ENV === 'production' ? 'http://176.109.111.167' : '',
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