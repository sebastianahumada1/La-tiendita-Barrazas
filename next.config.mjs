/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // En producción, es mejor ver los errores de TypeScript
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
