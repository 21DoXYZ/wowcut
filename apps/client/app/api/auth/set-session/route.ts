import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(req: Request) {
  const { access_token, refresh_token } = (await req.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "tokens required" }, { status: 400 });
  }

  // Build response first so we can attach Set-Cookie headers to it directly.
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
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

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    console.error("[set-session]", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}
