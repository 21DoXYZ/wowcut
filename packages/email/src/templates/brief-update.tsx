import { Button, Heading, Text } from "@react-email/components";
import { EmailShell } from "./_shell";

export interface BriefUpdateReminderEmailProps {
  brandName: string;
  briefUrl: string;
}

export function BriefUpdateReminderEmail({ brandName, briefUrl }: BriefUpdateReminderEmailProps) {
  return (
    <EmailShell preview="Anything changed? Takes 60 seconds">
      <Heading style={{ fontSize: "32px", fontWeight: 540, letterSpacing: "-0.64px", lineHeight: 1.1 }}>
        Anything new this month?
      </Heading>
      <Text style={{ fontSize: "16px", fontWeight: 330, lineHeight: 1.45, letterSpacing: "-0.14px", marginTop: "12px" }}>
        {brandName}, 3 quick questions so we keep your content fresh: new SKUs, upcoming promos, style tweaks.
      </Text>
      <Button
        href={briefUrl}
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
        Update brief
      </Button>
    </EmailShell>
  );
}
