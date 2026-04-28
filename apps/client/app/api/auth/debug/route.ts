import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@wowcut/db";

// Dev-only endpoint — shows server-side auth state to diagnose cookie/session issues.
// Remove or gate behind NEXT_PUBLIC_DEV_TOOLS before production.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = supabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      supabaseConfigured: false,
      reason: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing or invalid",
      envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)",
    });
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({
      supabaseConfigured: true,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUser: null,
      error: error?.message ?? "getUser() returned null",
      prismaClient: null,
    });
  }

  const client = await prisma.client.findUnique({
    where: { email: user.email! },
    select: { id: true, email: true, name: true, status: true },
  });

  return NextResponse.json({
    supabaseConfigured: true,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUser: { id: user.id, email: user.email },
    prismaClient: client ?? null,
    prismaClientFound: !!client,
    hint: !client
      ? `No Client row found for email "${user.email}". Run: pnpm db:seed or create a row manually.`
      : "Auth OK",
  });
}
