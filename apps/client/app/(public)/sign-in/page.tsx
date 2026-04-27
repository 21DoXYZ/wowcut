"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, MonoLabel } from "@wowcut/ui/components";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authErr } = await getSupabase().auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (authErr) setError(authErr.message);
      else setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.join("");
    if (token.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const { error: authErr } = await getSupabase().auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (authErr) {
        setError(authErr.message);
      } else {
        router.push("/deliveries");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onCodeInput(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      // auto-submit when all 6 digits filled
      setTimeout(() => {
        const form = document.getElementById("code-form") as HTMLFormElement | null;
        form?.requestSubmit();
      }, 80);
    }
  }

  function onCodeKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function onCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  return (
    <section className="max-w-[480px] mx-auto px-6 py-20">
      <MonoLabel>Sign in</MonoLabel>
      <h1 className="mt-4 brand-subheading">Access your Wowcut</h1>

      <Card className="mt-8 p-6">
        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
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
              Send code
            </Button>
          </form>
        ) : (
          <form id="code-form" onSubmit={verifyCode} className="space-y-5">
            <div>
              <p className="text-[14px] fw-430 text-ink leading-snug">
                Enter the 6-digit code sent to
              </p>
              <p className="text-[14px] fw-540 text-ink mt-0.5">{email}</p>
            </div>

            <div className="flex gap-2 justify-between" onPaste={onCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onCodeInput(i, e.target.value)}
                  onKeyDown={(e) => onCodeKeyDown(i, e)}
                  className="w-11 h-14 text-center text-[22px] fw-540 tracking-[-0.5px] rounded-[10px] border-2 border-ink/15 bg-paper focus:border-ink focus:outline-none transition-colors"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="text-[13px] fw-330 text-red-600">{error}</p>}

            <Button
              variant="black"
              type="submit"
              loading={loading}
              disabled={code.join("").length < 6}
              className="w-full"
            >
              Sign in
            </Button>

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(["","","","","",""]); setError(null); }}
              className="w-full text-[13px] fw-330 text-ink/50 hover:text-ink/80 transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </Card>
    </section>
  );
}
