import { Button, Heading, Img, Text } from "@react-email/components";
import { EmailShell } from "./_shell";

export interface PreviewReadyEmailProps {
  brandName: string;
  previewUrl: string;
  checkoutUrl: string;
}

export function PreviewReadyEmail({ brandName, previewUrl, checkoutUrl }: PreviewReadyEmailProps) {
  return (
    <EmailShell preview={`Your Wowcut preview for ${brandName} is ready`}>
      <Heading style={{ fontSize: "32px", fontWeight: 540, letterSpacing: "-0.64px", lineHeight: 1.1 }}>
        {brandName}, look what we made
      </Heading>
      <Text style={{ fontSize: "16px", fontWeight: 330, lineHeight: 1.45, letterSpacing: "-0.14px", marginTop: "12px" }}>
        Your preview is ready. Imagine 20 of these every month, on autopilot.
      </Text>
      <Img src={previewUrl} alt="Your preview" width="512" style={{ borderRadius: "8px", marginTop: "24px" }} />
      <Button
        href={checkoutUrl}
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
          padding: "12px 22px 14px",
          borderRadius: "50px",
          fontWeight: 450,
          fontSize: "16px",
          marginTop: "32px",
          display: "inline-block",
          textDecoration: "none",
        }}
      >
        Get 20 like this — $250/mo
      </Button>
    </EmailShell>
  );
}
