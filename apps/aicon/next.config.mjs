/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wowcut/db", "@wowcut/ai", "@wowcut/shared", "@wowcut/storage"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
      { protocol: "https", hostname: "pub-**.r2.dev" },
    ],
  },
};

export default nextConfig;
