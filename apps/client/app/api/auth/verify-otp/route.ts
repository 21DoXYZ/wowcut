import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(req: Request) {
  const { email, code } = (await req.json()) as { email?: string; code?: string };
  if (!email || !code)
    return NextResponse.json({ error: "email and code required" }, { status: 400 });

  const admin = getAdminClient();

  // Find user
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = listData?.users?.find((u) => u.email === email.toLowerCase().trim());
  if (!user) return NextResponse.json({ error: "invalid code" }, { status: 400 });

  // Check OTP
  const meta = user.user_metadata as { _otp?: string; _otp_exp?: number } | undefined;
  if (!meta?._otp || meta._otp !== code.trim() || Date.now() > (meta._otp_exp ?? 0)) {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 400 });
  }

  // Clear OTP
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { _otp: null, _otp_exp: null },
  });

  // Create session directly (no magic link redirect needed)
  const { data: sessionData, error: sessionErr } = await admin.auth.admin.createSession({
    userId: user.id,
  });

  if (sessionErr || !sessionData?.session) {
    console.error("[verify-otp] createSession failed", sessionErr);
    return NextResponse.json({ error: "session creation failed" }, { status: 500 });
  }

  const { access_token, refresh_token } = sessionData.session;

  // Set auth cookies directly on the response
  const response = NextResponse.json({ redirectUrl: "/deliveries" });

  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {});
          });
        },
      },
    },
  );

  await ssrClient.auth.setSession({ access_token, refresh_token });

  return response;
}
