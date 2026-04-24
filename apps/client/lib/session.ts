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
