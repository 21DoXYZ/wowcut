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
    outputFileTracingIncludes: {
      "**": [
        "../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
        "../../node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/libquery_engine-rhel-openssl-3.0.x.so.node",
      ],
    },
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
