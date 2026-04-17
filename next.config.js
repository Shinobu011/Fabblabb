/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore serialport in webpack to prevent build crashes
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            serialport: false,
        };
    }
    // Also ignore node native modules
    config.externals = [...(config.externals || []), 'serialport'];
    
    return config;
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'img.youtube.com'],
  },
  async redirects() {
    return [
      {
        source: '/api/bookings-schedule',
        destination: 'https://api.fablabqena.com/api/bookings-schedule',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig
