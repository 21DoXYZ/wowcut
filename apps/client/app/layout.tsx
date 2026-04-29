import type { Metadata } from "next";
import "@wowcut/ui/globals.css";
import { TrpcProvider } from "./_providers/trpc-provider";
import { PostHogProvider } from "./_providers/posthog-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wowcut — content on autopilot",
  description:
    "Templated content production for beauty & fashion DTC brands. 20 on-brand assets every month — $250.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-[340] tracking-[-0.14px]">
        <PostHogProvider>
          <TrpcProvider>{children}</TrpcProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
