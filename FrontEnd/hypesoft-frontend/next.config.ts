/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'http://localhost:3000',
      'http://172.16.0.2:3000', // adiciona o IP da sua máquina
    ],
  },
};

module.exports = nextConfig;
