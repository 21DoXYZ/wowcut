import { Button, Heading, Text } from "@react-email/components";
import { EmailShell } from "./_shell";

export interface TrendDropAnnouncementEmailProps {
  brandName: string;
  theme: string;
  description: string;
  libraryUrl: string;
}

export function TrendDropAnnouncementEmail({
  brandName,
  theme,
  description,
  libraryUrl,
}: TrendDropAnnouncementEmailProps) {
  return (
    <EmailShell preview={`This month's Trend Drop: ${theme}`}>
      <Heading style={{ fontSize: "32px", fontWeight: 540, letterSpacing: "-0.64px", lineHeight: 1.1 }}>
        Trend Drop: {theme}
      </Heading>
      <Text style={{ fontSize: "16px", fontWeight: 330, lineHeight: 1.45, letterSpacing: "-0.14px", marginTop: "12px" }}>
        {brandName}, this month we added 2 bonus units to your plan. {description}
      </Text>
      <Button
        href={libraryUrl}
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
        See this month
      </Button>
    </EmailShell>
  );
}
