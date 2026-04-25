import { prisma } from "@wowcut/db";
import { supabaseServerClient } from "./supabase-server";

export interface CurrentClientSession {
  email: string;
  clientId: string;
  brandName: string;
  slug: string;
  status: string;
}

export async function getCurrentClient(): Promise<CurrentClientSession | null> {
  // Dev bypass — set BYPASS_AUTH=true on Vercel to skip auth for testing.
  // Uses the real DB client record seeded by scripts/seed-db-only.ts
  if (process.env.BYPASS_AUTH === "true") {
    try {
      const devClient = await prisma.client.findUnique({ where: { email: "test@wowcut.ai" } });
      if (devClient) {
        return {
          email: devClient.email,
          clientId: devClient.id,
          brandName: devClient.name,
          slug: devClient.slug,
          status: devClient.status,
        };
      }
    } catch { /* fall through to normal auth */ }
  }

  const supabase = supabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const client = await prisma.client.findUnique({ where: { email: user.email } });
  if (!client) return null;
  return {
    email: client.email,
    clientId: client.id,
    brandName: client.name,
    slug: client.slug,
    status: client.status,
  };
}
