import withPWA from 'next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

export default withPWAConfig({
  experimental: { serverActions: { allowedOrigins: ['*'] } },
  // Acknowledge that we're using Turbopack (Next.js 16 default)
  // next-pwa adds a webpack config, but we silence the error here
  turbopack: {},
})
