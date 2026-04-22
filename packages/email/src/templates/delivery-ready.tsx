import { Button, Heading, Img, Text } from "@react-email/components";
import { EmailShell } from "./_shell";

export interface DeliveryReadyEmailProps {
  brandName: string;
  weekNumber: number;
  heroImageUrl: string;
  unitCount: number;
  deliveryUrl: string;
}

export function DeliveryReadyEmail({
  brandName,
  weekNumber,
  heroImageUrl,
  unitCount,
  deliveryUrl,
}: DeliveryReadyEmailProps) {
  return (
    <EmailShell preview={`Week ${weekNumber}: your ${unitCount} new assets are ready`}>
      <Heading style={{ fontSize: "32px", fontWeight: 540, letterSpacing: "-0.64px", lineHeight: 1.1 }}>
        Week {weekNumber}: {unitCount} new assets
      </Heading>
      <Text style={{ fontSize: "16px", fontWeight: 330, lineHeight: 1.45, letterSpacing: "-0.14px", marginTop: "12px" }}>
        Ready when you are, {brandName}. Includes captions, hashtags, and the full publishing pack.
      </Text>
      <Img src={heroImageUrl} alt="This week's hero" width="512" style={{ borderRadius: "8px", marginTop: "24px" }} />
      <Button
        href={deliveryUrl}
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
        Open delivery
      </Button>
    </EmailShell>
  );
}
