/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 15 : clé top-level pour les modules serveur lourds.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
