import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

const styles = {
  body: {
    backgroundColor: "#ffffff",
    fontFamily:
      "'General Sans Variable', 'Inter', -apple-system, system-ui, sans-serif, 'helvetica'",
    margin: 0,
    padding: 0,
    color: "#000000",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "48px 24px",
  },
  logo: {
    fontSize: "24px",
    fontWeight: 540,
    letterSpacing: "-0.96px",
    color: "#000000",
    marginBottom: "32px",
  },
  footer: {
    fontSize: "12px",
    fontWeight: 320,
    color: "#666666",
    letterSpacing: "0.6px",
    textTransform: "uppercase" as const,
    marginTop: "40px",
  },
};

export interface EmailShellProps {
  preview: string;
  children: ReactNode;
}

export function EmailShell({ preview, children }: EmailShellProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <Text style={styles.logo}>WOWCUT</Text>
          </Section>
          {children}
          <Hr style={{ margin: "32px 0", borderColor: "#000", borderStyle: "dashed", borderWidth: "1px 0 0 0" }} />
          <Text style={styles.footer}>Wowcut — content on autopilot</Text>
        </Container>
      </Body>
    </Html>
  );
}
