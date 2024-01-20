/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "currencyfreaks.com",
      },
    ],
  },
};

module.exports = nextConfig;
