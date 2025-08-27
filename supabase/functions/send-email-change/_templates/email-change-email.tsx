import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface EmailChangeEmailProps {
  confirmationUrl: string
  userName: string
  newEmail: string
  oldEmail: string
}

export const EmailChangeEmail = ({
  confirmationUrl,
  userName,
  newEmail,
  oldEmail,
}: EmailChangeEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmez le changement de votre adresse courriel Cuizly</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo */}
        <Section style={logoSection}>
          <Img
            src="https://ffgkzvnbsdnfgmcxturx.lovable.app/cuizly-logo.png"
            width="120"
            height="40"
            alt="Cuizly"
            style={logo}
          />
        </Section>

        {/* Header */}
        <Heading style={h1}>
          Changement d'adresse courriel
        </Heading>

        {/* Main content */}
        <Text style={text}>
          Bonjour {userName},
        </Text>

        <Text style={text}>
          Vous avez demandé de changer votre adresse courriel associée à votre compte Cuizly.
        </Text>

        {/* Email change details */}
        <Section style={changeSection}>
          <Text style={changeText}>
            <strong>Ancienne adresse :</strong> {oldEmail}
          </Text>
          <Text style={changeText}>
            <strong>Nouvelle adresse :</strong> {newEmail}
          </Text>
        </Section>

        <Text style={text}>
          Pour confirmer ce changement, cliquez sur le bouton ci-dessous. Cette confirmation est nécessaire pour sécuriser votre compte.
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={confirmationUrl}
            style={button}
          >
            Confirmer le changement
          </Link>
        </Section>

        {/* Alternative link */}
        <Text style={smallText}>
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </Text>
        <Text style={linkText}>
          {confirmationUrl}
        </Text>

        {/* Security notice */}
        <Section style={securitySection}>
          <Text style={securityText}>
            <strong>Sécurité :</strong> Si vous n'avez pas demandé ce changement, contactez-nous immédiatement à support@cuizly.com. Votre adresse courriel actuelle restera inchangée jusqu'à confirmation.
          </Text>
        </Section>

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

// Styles inspired by Cuizly's minimal design
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#171717', // --cuizly-primary
  fontSize: '28px',
  fontWeight: '700',
  textAlign: 'center' as const,
  margin: '0 0 30px 0',
  lineHeight: '1.3',
}

const text = {
  color: '#171717',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
}

const smallText = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '20px 0 10px 0',
}

const linkText = {
  color: '#737373',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f5f5f5',
  padding: '10px',
  borderRadius: '8px',
  fontFamily: 'monospace',
}

const changeSection = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '12px',
  margin: '20px 0',
  border: '1px solid #e2e8f0',
}

const changeText = {
  color: '#171717',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 10px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const button = {
  backgroundColor: '#171717', // --cuizly-primary
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  borderRadius: '50px',
  border: 'none',
  cursor: 'pointer',
}

const securitySection = {
  backgroundColor: '#fef2f2', // Light red background
  padding: '20px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #fecaca',
}

const securityText = {
  color: '#dc2626', // Red text
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const footer = {
  color: '#737373',
  fontSize: '14px',
  textAlign: 'center' as const,
  marginTop: '40px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e5e5',
}