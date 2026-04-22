"use client";
import posthog from "posthog-js";
import { PostHogProvider as RawProvider } from "posthog-js/react";
import { useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (typeof window !== "undefined" && KEY && !posthog.__loaded) {
  posthog.init(KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: false,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && KEY) {
      posthog.capture("$pageview");
    }
  }, []);
  if (!KEY) return <>{children}</>;
  return <RawProvider client={posthog}>{children}</RawProvider>;
}
