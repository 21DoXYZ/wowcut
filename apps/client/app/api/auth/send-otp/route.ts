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
  const { email } = (await req.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const supabase = getAdminClient();

  // Check user exists in Supabase
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = listData?.users?.find((u) => u.email === email.toLowerCase().trim());
  if (!user) {
    // Don't reveal if user exists — show same message
    return NextResponse.json({ ok: true });
  }

  // Generate code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 10 * 60 * 1000;

  // Store in user metadata (server-only, not exposed to browser)
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { _otp: code, _otp_exp: expires },
  });

  // Send clean email via Resend (no magic link, just the code)
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "email not configured" }, { status: 500 });

  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:40px 20px">
      <p style="font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px">Wowcut</p>
      <h1 style="font-size:28px;font-weight:700;margin:0 0 8px">Your sign-in code</h1>
      <p style="color:#555;margin:0 0 32px">Enter this code on the sign-in page. Valid for 10 minutes.</p>
      <div style="font-size:40px;font-weight:800;letter-spacing:0.15em;background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px">${code}</div>
      <p style="font-size:12px;color:#999">If you didn't request this, ignore this email.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Wowcut <hello@wowcut.ai>",
      to: [email],
      subject: `${code} — your Wowcut sign-in code`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[send-otp] Resend error", await res.text());
    return NextResponse.json({ error: "failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
