import { Button, Heading, Text } from "@react-email/components";
import { EmailShell } from "./_shell";

export interface PilotReadyEmailProps {
  brandName: string;
  pilotUrl: string;
  sampleCount: number;
}

export function PilotReadyEmail({ brandName, pilotUrl, sampleCount }: PilotReadyEmailProps) {
  return (
    <EmailShell preview={`Your first ${sampleCount} Wowcut samples are ready`}>
      <Heading style={{ fontSize: "32px", fontWeight: 540, letterSpacing: "-0.64px", lineHeight: 1.1 }}>
        {sampleCount} samples, ready for your eyes
      </Heading>
      <Text style={{ fontSize: "16px", fontWeight: 330, lineHeight: 1.45, letterSpacing: "-0.14px", marginTop: "12px" }}>
        {brandName} — pick your favorite. Once you approve, we start your week 1.
      </Text>
      <Button
        href={pilotUrl}
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
        Review samples
      </Button>
    </EmailShell>
  );
}
