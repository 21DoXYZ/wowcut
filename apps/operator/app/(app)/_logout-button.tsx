"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-mono text-ink/45 hover:text-ink transition-colors"
    >
      Sign out
    </button>
  );
}
