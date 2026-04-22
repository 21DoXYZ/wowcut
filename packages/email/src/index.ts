import { Resend } from "resend";
import type { ReactElement } from "react";

const FROM = process.env.RESEND_FROM_EMAIL ?? "hello@wowcut.ai";

let cached: Resend | null = null;
function getClient(): Resend {
  if (cached) return cached;
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const client = getClient();
  const { data, error } = await client.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    react: input.react,
    reply_to: input.replyTo,
    tags: input.tags,
  });
  if (error || !data) throw new Error(error?.message ?? "Email send failed");
  return { id: data.id };
}

export * from "./templates";
