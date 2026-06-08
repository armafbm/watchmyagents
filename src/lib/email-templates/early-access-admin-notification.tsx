import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  signupEmail?: string;
  source?: string;
  userAgent?: string;
  signedUpAt?: string;
}

const EarlyAccessAdminNotification = ({
  signupEmail = "unknown@example.com",
  source = "landing_cta",
  userAgent = "n/a",
  signedUpAt = new Date().toISOString(),
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New early access request — {signupEmail}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={tag}>// FORTRESS · NEW SIGNUP</Text>
        <Heading style={h1}>New early access request</Heading>

        <Section style={card}>
          <Text style={row}>
            <strong>Email:</strong> {signupEmail}
          </Text>
          <Text style={row}>
            <strong>Source:</strong> {source}
          </Text>
          <Text style={row}>
            <strong>Signed up at:</strong> {signedUpAt}
          </Text>
          <Text style={row}>
            <strong>User agent:</strong> {userAgent}
          </Text>
        </Section>

        <Text style={footer}>WatchMyAgents · internal notification</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: EarlyAccessAdminNotification,
  subject: "New WatchMyAgents early access request",
  displayName: "Early access — admin notification",
  previewData: {
    signupEmail: "jane@example.com",
    source: "landing_cta",
    userAgent: "Mozilla/5.0",
    signedUpAt: new Date().toISOString(),
  },
} satisfies TemplateEntry;

export default EarlyAccessAdminNotification;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  padding: "40px 0",
};
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 24px" };
const tag = {
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#0891b2",
  margin: "0 0 12px",
  fontWeight: "bold" as const,
};
const h1 = {
  fontFamily: '"Orbitron", "Space Grotesk", system-ui, sans-serif',
  fontSize: "24px",
  fontWeight: 900 as const,
  color: "#0a1628",
  margin: "0 0 20px",
};
const card = {
  background: "#f8fafc",
  border: "1px solid #cfe7f1",
  borderLeft: "3px solid #06b6d4",
  borderRadius: "8px",
  padding: "20px 22px",
  margin: "0 0 24px",
};
const row = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#1f2937",
  margin: "0 0 8px",
};
const footer = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "#6b7280",
  margin: "0",
};
