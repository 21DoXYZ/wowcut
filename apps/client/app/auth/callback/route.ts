import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/deliveries";

  // PKCE flow — code in query param
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Implicit flow — tokens arrive in URL hash (#access_token=...).
  // The hash is never sent to the server, so we return a minimal HTML page
  // that reads it client-side, POSTs to /api/auth/set-session, then redirects.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing in…</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <p id="msg">Signing in…</p>
  <script>
    (function () {
      var hash = window.location.hash.substring(1);
      var p = new URLSearchParams(hash);
      var at = p.get('access_token');
      var rt = p.get('refresh_token');
      if (!at || !rt) {
        window.location.href = '/sign-in?error=auth_failed';
        return;
      }
      fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: at, refresh_token: rt })
      })
        .then(function(r){ return r.json(); })
        .then(function(d){ window.location.href = d.ok ? '/deliveries' : '/sign-in?error=auth_failed'; })
        .catch(function(){ window.location.href = '/sign-in?error=auth_failed'; });
    })();
  </script>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
