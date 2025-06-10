/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'dd-trace', 'hot-shots', 'winston']
  },
  images: {
    domains: ['localhost', 'cloudinary.com', 'res.cloudinary.com', 'images.unsplash.com', 'cdn.shopify.com']
  },
  // DataDog APM configuration
  webpack: (config, { dev, isServer }) => {
    // Add DataDog tracing for production
    if (!dev && isServer && process.env.DD_TRACE_ENABLED === 'true') {
      config.externals.push('dd-trace');
    }
    return config;
  },
}

module.exports = nextConfig 