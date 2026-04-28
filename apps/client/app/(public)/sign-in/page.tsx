"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Card, Input, Label, MonoLabel } from "@wowcut/ui/components";

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (err) {
      setError("Email not found. Contact support if you have an account.");
      return;
    }
    setStep("sent");
  }

  return (
    <section className="max-w-[480px] mx-auto px-6 py-20">
      <MonoLabel>Sign in</MonoLabel>
      <h1 className="mt-4 brand-subheading">Access your Wowcut</h1>

      <Card className="mt-8 p-6">
        {step === "email" ? (
          <form onSubmit={sendLink} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brand.com"
              />
            </div>
            {error && <p className="text-[13px] fw-330 text-red-600">{error}</p>}
            <Button variant="black" type="submit" loading={loading} className="w-full">
              Send sign-in link
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[14px] fw-430 text-ink leading-snug">
                Check your inbox
              </p>
              <p className="text-[14px] fw-330 text-ink/60 mt-1 leading-snug">
                We sent a sign-in link to{" "}
                <span className="fw-540 text-ink">{email}</span>.
                Click it to access your account.
              </p>
            </div>
            <p className="text-[13px] fw-330 text-ink/40">
              The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(null); }}
              className="w-full text-[13px] fw-330 text-ink/50 hover:text-ink/80 transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}
