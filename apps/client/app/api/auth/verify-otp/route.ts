import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(req: Request) {
  const { email, code } = (await req.json()) as { email?: string; code?: string };
  if (!email || !code) return NextResponse.json({ error: "email and code required" }, { status: 400 });

  const supabase = getAdminClient();

  // Find user and check metadata OTP
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = listData?.users?.find((u) => u.email === email.toLowerCase().trim());
  if (!user) return NextResponse.json({ error: "invalid code" }, { status: 400 });

  const meta = user.user_metadata as { _otp?: string; _otp_exp?: number } | undefined;
  const storedCode = meta?._otp;
  const expires = meta?._otp_exp ?? 0;

  if (!storedCode || storedCode !== code.trim() || Date.now() > expires) {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 400 });
  }

  // Clear the OTP from metadata
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { _otp: null, _otp_exp: null },
  });

  // Generate a magic-link token so we can create a real browser session
  const origin = new URL(req.url).origin;
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[verify-otp] generateLink failed", linkErr);
    return NextResponse.json({ error: "session creation failed" }, { status: 500 });
  }

  // Return the action_link — the client will redirect to it.
  // Supabase processes this link, sets auth cookies, then redirects to /auth/callback → /deliveries.
  return NextResponse.json({ redirectUrl: linkData.properties.action_link });
}
