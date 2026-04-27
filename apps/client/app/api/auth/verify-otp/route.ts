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
  const body = await req.json().catch(() => null);
  const email: string | undefined = body?.email;
  const code: string | undefined = body?.code;

  if (!email || !code) {
    return NextResponse.json({ error: "email and code required" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = listData?.users?.find((u) => u.email === email.toLowerCase().trim());
  if (!user) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  const meta = user.user_metadata as { _otp?: string; _otp_exp?: number } | undefined;
  if (!meta?._otp || meta._otp !== code.trim() || Date.now() > (meta._otp_exp ?? 0)) {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 400 });
  }

  // Clear OTP before creating session
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { _otp: null, _otp_exp: null },
  });

  // Create session — return raw tokens so the browser client can call setSession()
  // and store them in SSR-compatible cookies itself.
  const { data: sessionData, error: sessionErr } = await admin.auth.admin.createSession({
    userId: user.id,
  });

  if (sessionErr || !sessionData?.session) {
    console.error("[verify-otp] createSession failed", sessionErr);
    return NextResponse.json({ error: "session creation failed" }, { status: 500 });
  }

  return NextResponse.json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });
}
