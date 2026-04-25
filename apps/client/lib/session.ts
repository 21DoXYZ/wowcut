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
  // Dev bypass — set BYPASS_AUTH=true to skip all auth checks.
  // clientId matches the record seeded by scripts/seed-db-only.ts
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
    return {
      email: "test@wowcut.ai",
      clientId: "cmoe9rrg80004o8c3miafii5p",
      brandName: "Dev Brand",
      slug: "dev-wowcut",
      status: "active",
    };
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
