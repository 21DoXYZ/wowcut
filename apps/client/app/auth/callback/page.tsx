"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const code = searchParams.get("code");

    if (code) {
      // PKCE flow: exchange code for session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace("/sign-in?error=auth_failed");
        } else {
          router.replace("/deliveries");
        }
      });
      return;
    }

    // Implicit / token flow: createBrowserClient auto-processes URL hash,
    // just need to wait a tick then read the session.
    setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/deliveries");
        } else {
          router.replace("/sign-in?error=auth_failed");
        }
      });
    }, 100);
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[14px] fw-330 text-ink/50">Signing you in...</p>
    </div>
  );
}
