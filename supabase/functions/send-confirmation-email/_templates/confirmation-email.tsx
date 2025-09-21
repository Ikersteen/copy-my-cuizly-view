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
    <Preview>Confirmez votre adresse email pour accéder à Cuizly</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo */}
        <Section style={logoSection}>
          <Link href="https://www.cuizly.ca" style={{ textDecoration: 'none' }}>
            <Img
              src="https://www.cuizly.ca/lovable-uploads/db9c9936-605a-4c88-aa46-6154a944bb5c.png"
              width="120"
              height="40"
              alt="Cuizly"
              style={logo}
            />
          </Link>
        </Section>

        {/* Header */}
        <Heading style={h1}>
          Confirmez votre email
        </Heading>

        {/* Main content */}
        <Text style={text}>
          Bonjour {userName},
        </Text>

        <Text style={text}>
          Merci de vous être inscrit sur Cuizly ! Pour finaliser la création de votre compte {userType === 'consumer' ? 'consommateur' : 'restaurateur'}, veuillez confirmer votre adresse email.
        </Text>

        <Text style={text}>
          Cliquez sur le bouton ci-dessous pour activer votre compte :
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={confirmationUrl}
            style={button}
          >
            Confirmer mon email
          </Link>
        </Section>

        {/* Alternative link */}
        <Text style={smallText}>
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </Text>
        <Text style={linkText}>
          {confirmationUrl}
        </Text>

        {/* What's next */}
        <Section style={nextStepsSection}>
          <Text style={text}>
            <strong>Après confirmation, vous pourrez :</strong>
          </Text>
          
          {userType === 'consumer' ? (
            <>
              <Text style={listItem}>• Découvrir les meilleurs restaurants de Montréal</Text>
              <Text style={listItem}>• Recevoir des recommandations personnalisées</Text>
              <Text style={listItem}>• Accéder aux offres exclusives</Text>
              <Text style={listItem}>• Sauvegarder vos favoris</Text>
            </>
          ) : (
            <>
              <Text style={listItem}>• Créer et gérer vos offres</Text>
              <Text style={listItem}>• Accéder à votre tableau de bord</Text>
              <Text style={listItem}>• Analyser vos performances</Text>
              <Text style={listItem}>• Connecter avec de nouveaux clients</Text>
            </>
          )}
        </Section>

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>

        <Text style={disclaimer}>
          Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email en toute sécurité.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

// Styles inspired by Cuizly's minimal design
const main = {
  backgroundColor: '#f0f4ff', // Same as site background (--background: 225 100% 96%)
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