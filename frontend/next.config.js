/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `domains` foi depreciado por ser amplo demais: autorizava qualquer caminho
    // do host. `remotePatterns` restringe protocolo, porta e caminho.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
