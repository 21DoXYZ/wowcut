"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.replace("/sign-in?error=no_code");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace("/sign-in?error=auth_failed");
      } else {
        router.replace("/deliveries");
      }
    });
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[14px] fw-330 text-ink/50">Signing you in...</p>
    </div>
  );
}
