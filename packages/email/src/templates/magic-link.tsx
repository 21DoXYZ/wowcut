import { Button, Heading, Text } from "@react-email/components";
import { EmailShell } from "./_shell";

export interface MagicLinkEmailProps {
  url: string;
  brandName?: string;
}

export function MagicLinkEmail({ url, brandName }: MagicLinkEmailProps) {
  return (
    <EmailShell preview={`Sign in to Wowcut${brandName ? ` — ${brandName}` : ""}`}>
      <Heading style={{ fontSize: "32px", fontWeight: 540, letterSpacing: "-0.64px", lineHeight: 1.1 }}>
        Sign in to Wowcut
      </Heading>
      <Text style={{ fontSize: "16px", fontWeight: 330, lineHeight: 1.45, letterSpacing: "-0.14px", marginTop: "12px" }}>
        Click the button below to access your account{brandName ? ` — ${brandName}` : ""}. This link expires in 10 minutes.
      </Text>
      <Button
        href={url}
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
          padding: "12px 22px 14px",
          borderRadius: "50px",
          fontWeight: 450,
          fontSize: "16px",
          letterSpacing: "-0.14px",
          textDecoration: "none",
          marginTop: "32px",
          display: "inline-block",
        }}
      >
        Open Wowcut
      </Button>
      <Text style={{ fontSize: "14px", fontWeight: 320, color: "#666", marginTop: "24px" }}>
        If you didn't request this, you can safely ignore it.
      </Text>
    </EmailShell>
  );
}
