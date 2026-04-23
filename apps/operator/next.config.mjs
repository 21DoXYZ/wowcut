import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
