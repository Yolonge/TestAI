/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // Определяем URL бэкенда на основе окружения
    const backendUrl = process.env.BACKEND_URL || 'http://codeduelplatform:80';
    
    return [
      // Проксирование API запросов на бэкенд
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, // URL бэкенда с переменной
      },
      // Проксирование SignalR хаба
      {
        source: '/hubs/:path*',
        destination: `${backendUrl}/hubs/:path*`, // URL бэкенда с переменной
      },
    ];
  },
};

module.exports = nextConfig; 