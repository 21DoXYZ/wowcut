import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Direct login without email — for test accounts only.
 * GET /api/auth/magic?s=SECRET&email=hello@wowcut.ai
 * SECRET = LOGIN_SECRET env var (set in Vercel)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("s");
  const email = url.searchParams.get("email") ?? "hello@wowcut.ai";

  const expected = process.env.LOGIN_SECRET;
  if (!expected || secret !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const origin = url.origin;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data?.properties?.action_link) {
    return new NextResponse(`Error: ${error?.message ?? "no link"}`, { status: 500 });
  }

  return NextResponse.redirect(data.properties.action_link);
}
