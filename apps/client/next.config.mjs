/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@wowcut/ui",
    "@wowcut/api",
    "@wowcut/shared",
    "@wowcut/db",
    "@wowcut/ai",
    "@wowcut/storage",
    "@wowcut/queues",
  ],
  experimental: {
    serverComponentsExternalPackages: [
      "@wowcut/email",
      "@react-email/components",
      "react-email",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "media.wowcut.ai" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
