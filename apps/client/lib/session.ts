import { cookies } from "next/headers";
import { prisma } from "@wowcut/db";
import { supabaseServerClient } from "./supabase-server";

export interface CurrentClientSession {
  email: string;
  clientId: string;
  brandName: string;
  slug: string;
  status: string;
}

const DEV_SESSION: CurrentClientSession = {
  email: "test@wowcut.ai",
  clientId: "cmoe9rrg80004o8c3miafii5p",
  brandName: "Dev Brand",
  slug: "dev-wowcut",
  status: "active",
};

export async function getCurrentClient(): Promise<CurrentClientSession | null> {
  // Dev bypass: set cookie devbypass=1 in browser DevTools to skip auth.
  // Works regardless of env var configuration.
  if (process.env.NODE_ENV === "development" && cookies().get("devbypass")?.value === "1") {
    return DEV_SESSION;
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
