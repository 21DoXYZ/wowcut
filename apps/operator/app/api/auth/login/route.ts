import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };
  const secret = process.env.OPERATOR_SECRET;

  if (!secret || password !== secret) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ops_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
