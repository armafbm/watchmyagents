import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'WatchMyAgents'
const SITE_URL = 'https://watchmyagents.com'

const EarlyAccessConfirmation = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for joining the {SITE_NAME} early access</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={tag}>// FORTRESS · EARLY ACCESS</Text>
          <Heading style={h1}>You're on the list.</Heading>
        </Section>

        <Section style={card}>
          <Text style={text}>
            Thanks for requesting early access to <strong>{SITE_NAME}</strong>.
          </Text>
          <Text style={text}>
            Your AI agents — under protection. Watch detects, Shield enforces,
            Guardian explains. We're onboarding teams in waves and we'll come
            back to you very soon with your access details.
          </Text>
          <Text style={text}>
            In the meantime, if you want to tell us about the agents you're
            shipping, just reply to this email — we read every message.
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          {SITE_NAME} · Cybersecurity for AI Agents
          <br />
          <Link href={SITE_URL} style={link}>
            watchmyagents.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EarlyAccessConfirmation,
  subject: `Thanks for joining ${SITE_NAME} early access`,
  displayName: 'Early access confirmation',
  previewData: {},
} satisfies TemplateEntry

export default EarlyAccessConfirmation

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  padding: '40px 0',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 24px',
}
const header = { marginBottom: '24px' }
const tag = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#0891b2',
  margin: '0 0 12px',
  fontWeight: 'bold' as const,
}
const h1 = {
  fontFamily: '"Orbitron", "Space Grotesk", system-ui, sans-serif',
  fontSize: '28px',
  fontWeight: 900 as const,
  color: '#0a1628',
  letterSpacing: '-0.01em',
  margin: '0',
}
const card = {
  background: 'linear-gradient(135deg, #f8fafc 0%, #eef6fb 100%)',
  border: '1px solid #cfe7f1',
  borderLeft: '3px solid #06b6d4',
  borderRadius: '8px',
  padding: '24px 22px',
  margin: '0 0 28px',
}
const text = {
  fontSize: '14px',
  lineHeight: '1.65',
  color: '#1f2937',
  margin: '0 0 14px',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const link = { color: '#0891b2', textDecoration: 'none' }
const footer = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  margin: '0',
  lineHeight: '1.6',
}
