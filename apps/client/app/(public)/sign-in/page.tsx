"use client";
import { useState } from "react";
import { Button, Card, Input, Label, MonoLabel } from "@wowcut/ui/components";
import { createBrowserClient } from "@supabase/ssr";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { error: authErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/deliveries`,
        },
      });
      if (authErr) setError(authErr.message);
      else setSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="max-w-[480px] mx-auto px-6 py-20">
      <MonoLabel>Sign in</MonoLabel>
      <h1 className="mt-4 brand-subheading">Access your Wowcut</h1>
      <Card className="mt-8 p-6">
        {sent ? (
          <p className="text-body fw-330 text-ink/80">
            Check your email. The magic link expires in 10 minutes.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
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
            {error && <p className="text-body fw-330 text-red-700">{error}</p>}
            <Button variant="black" type="submit" className="w-full">
              Send magic link
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}
