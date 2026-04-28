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
  if (!supabase) {
    console.log("[session] supabaseServerClient returned null - missing env vars");
    return null;
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user?.email) {
    console.log("[session] getUser returned no user", userError?.message);
    return null;
  }
  console.log("[session] got user:", user.email);
  const client = await prisma.client.findUnique({ where: { email: user.email } });
  if (!client) {
    console.log("[session] no Client row for:", user.email, "DB:", process.env.DATABASE_URL?.slice(0, 50));
    return null;
  }
  return {
    email: client.email,
    clientId: client.id,
    brandName: client.name,
    slug: client.slug,
    status: client.status,
  };
}
