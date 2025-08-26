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

interface PasswordResetEmailProps {
  resetUrl: string
  userName?: string
}

export const PasswordResetEmail = ({
  resetUrl,
  userName,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Réinitialisez votre mot de passe Cuizly</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo */}
        <Section style={logoSection}>
          <Img
            src="https://your-domain.com/cuizly-logo.png"
            width="120"
            height="40"
            alt="Cuizly"
            style={logo}
          />
        </Section>

        {/* Header */}
        <Heading style={h1}>
          Réinitialisation de mot de passe
        </Heading>

        {/* Main content */}
        <Text style={text}>
          {userName ? `Bonjour ${userName},` : 'Bonjour,'}
        </Text>

        <Text style={text}>
          Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Cuizly.
        </Text>

        <Text style={text}>
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valide pendant <strong>24 heures</strong>.
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={resetUrl}
            style={button}
          >
            Réinitialiser mon mot de passe
          </Link>
        </Section>

        {/* Alternative link */}
        <Text style={smallText}>
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </Text>
        <Text style={linkText}>
          {resetUrl}
        </Text>

        {/* Security notice */}
        <Section style={securitySection}>
          <Text style={securityText}>
            <strong>Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.
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

export default PasswordResetEmail

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
  backgroundColor: '#fafafa', // --cuizly-surface
  padding: '20px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #e5e5e5',
}

const securityText = {
  color: '#525252', // --cuizly-accent
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