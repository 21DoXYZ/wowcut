import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

async function findUserByEmail(admin: SupabaseClient, email: string) {
  let page = 1;
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000, page });
    if (!data?.users?.length) return null;
    const match = data.users.find((u) => u.email === email);
    if (match) return match;
    if (data.users.length < 1000) return null;
    page++;
  }
}

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

  const user = await findUserByEmail(admin, email.toLowerCase().trim());
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

  // Generate a one-time magic-link token hash. The browser calls verifyOtp()
  // with this hash, which sets SSR-compatible cookies via createBrowserClient.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email!,
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("[verify-otp] generateLink failed", linkErr);
    return NextResponse.json({ error: "session creation failed" }, { status: 500 });
  }

  return NextResponse.json({
    token_hash: linkData.properties.hashed_token,
  });
}
