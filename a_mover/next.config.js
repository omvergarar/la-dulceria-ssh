/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
    // Permite imágenes locales en /public/uploads
    unoptimized: false,
  },
  // Compatibilidad con Hostinger Node.js Web Apps
  output: 'standalone',
  // En Next.js 15+ esta opción se movió fuera de experimental
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
