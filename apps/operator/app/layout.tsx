import type { Metadata } from "next";
import "@wowcut/ui/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TrpcProvider } from "./_providers/trpc-provider";


export const metadata: Metadata = {
  title: "Wowcut Operator OS",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-paper text-ink">
          <TrpcProvider>{children}</TrpcProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
