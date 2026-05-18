"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, MonoLabel } from "@wowcut/ui/components";

export default function SignInPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace("/");
    } else {
      setError("Wrong password.");
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <MonoLabel>Operator OS</MonoLabel>
        <h1 className="mt-3 brand-heading">Sign in</h1>
        <Card className="mt-8 p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && <p className="text-[13px] fw-330 text-red-600">{error}</p>}
            <Button variant="black" type="submit" loading={loading} className="w-full">
              Enter
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
