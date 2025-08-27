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

interface ReauthenticationEmailProps {
  confirmationUrl: string
  userName: string
  actionDescription: string
}

export const ReauthenticationEmail = ({
  confirmationUrl,
  userName,
  actionDescription,
}: ReauthenticationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmez votre identité pour continuer</Preview>
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
          Confirmation requise
        </Heading>

        {/* Main content */}
        <Text style={text}>
          Bonjour {userName},
        </Text>

        <Text style={text}>
          Pour des raisons de sécurité, nous devons confirmer votre identité avant de procéder à cette action :
        </Text>

        {/* Action details */}
        <Section style={actionSection}>
          <Text style={actionText}>
            <strong>Action demandée :</strong> {actionDescription}
          </Text>
        </Section>

        <Text style={text}>
          Cliquez sur le bouton ci-dessous pour confirmer votre identité et poursuivre. Ce lien de confirmation est valide pendant <strong>15 minutes</strong>.
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={confirmationUrl}
            style={button}
          >
            Confirmer mon identité
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
            <strong>Sécurité :</strong> Cette confirmation est requise pour protéger votre compte. Si vous n'avez pas initié cette action, contactez-nous immédiatement à support@cuizly.com.
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

export default ReauthenticationEmail

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

const actionSection = {
  backgroundColor: '#fff7ed',
  padding: '20px',
  borderRadius: '12px',
  margin: '20px 0',
  border: '1px solid #fed7aa',
}

const actionText = {
  color: '#ea580c',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
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