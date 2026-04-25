/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 15 : modules serveur lourds isolés du bundle client.
  serverExternalPackages: ['@prisma/client', '@next-auth/prisma-adapter'],
};

export default nextConfig;
