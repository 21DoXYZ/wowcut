import type { Metadata } from "next";
import "./globals.css";
import { TrpcProvider } from "./_providers/trpc-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "aicon — AI content farm",
  description: "Turn any topic into a viral short-form video in minutes.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
