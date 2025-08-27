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

interface ConfirmationEmailProps {
  confirmationUrl: string
  userName: string
  userType: 'consumer' | 'restaurant_owner'
}

export const ConfirmationEmail = ({
  confirmationUrl,
  userName,
  userType,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmez votre adresse courriel pour accéder à Cuizly</Preview>
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
          Confirmez votre courriel
        </Heading>

        {/* Main content */}
        <Text style={text}>
          Bonjour {userName},
        </Text>

        <Text style={text}>
          Merci de vous être inscrit sur Cuizly ! Pour finaliser votre inscription, veuillez confirmer votre adresse courriel.
        </Text>

        <Text style={text}>
          Sélectionnez le lien ci-dessous pour confirmer votre compte :
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={confirmationUrl}
            style={button}
          >
            Confirmer mon adresse courriel
          </Link>
        </Section>

        <Text style={smallText}>
          Ce lien est valide pendant 24 heures.
        </Text>

        {/* What's next */}
        <Section style={nextStepsSection}>
          <Text style={text}>
            <strong>Une fois votre compte confirmé :</strong>
          </Text>
          
          {userType === 'consumer' ? (
            <>
              <Text style={listItem}>• Explorez les restaurants de Montréal</Text>
              <Text style={listItem}>• Consultez les recommandations</Text>
              <Text style={listItem}>• Gérez vos préférences</Text>
              <Text style={listItem}>• Enregistrez vos favoris</Text>
            </>
          ) : (
            <>
              <Text style={listItem}>• Gérez votre établissement</Text>
              <Text style={listItem}>• Utilisez votre tableau de bord</Text>
              <Text style={listItem}>• Consultez les statistiques</Text>
              <Text style={listItem}>• Rejoignez la communauté</Text>
            </>
          )}
        </Section>

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>

        <Text style={disclaimer}>
          Si vous n'avez pas créé ce compte, vous pouvez ignorer ce courriel en toute sécurité.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

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

const listItem = {
  color: '#737373', // --cuizly-neutral
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
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

const nextStepsSection = {
  backgroundColor: '#fafafa', // --cuizly-surface
  padding: '20px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #e5e5e5',
}

const footer = {
  color: '#737373',
  fontSize: '14px',
  textAlign: 'center' as const,
  marginTop: '40px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e5e5',
}

const disclaimer = {
  color: '#a3a3a3',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
  fontStyle: 'italic',
}