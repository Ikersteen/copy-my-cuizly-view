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

interface UserInvitationEmailProps {
  invitationUrl: string
  inviterName: string
  inviteeName: string
  userType: 'consumer' | 'restaurant_owner'
  customMessage?: string
}

export const UserInvitationEmail = ({
  invitationUrl,
  inviterName,
  inviteeName,
  userType,
  customMessage,
}: UserInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>Invitation à rejoindre Cuizly</Preview>
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
          Vous êtes invité à rejoindre Cuizly !
        </Heading>

        {/* Main content */}
        <Text style={text}>
          Bonjour {inviteeName},
        </Text>

        <Text style={text}>
          <strong>{inviterName}</strong> vous invite à découvrir Cuizly, la plateforme qui révolutionne la découverte culinaire à Montréal !
        </Text>

        {customMessage && (
          <Section style={messageSection}>
            <Text style={messageText}>
              <em>"{customMessage}"</em>
            </Text>
            <Text style={messageAuthor}>
              - {inviterName}
            </Text>
          </Section>
        )}

        {/* What is Cuizly */}
        <Text style={text}>
          {userType === 'consumer' 
            ? "Cuizly utilise l'intelligence artificielle pour vous recommander les meilleurs restaurants et offres culinaires de Montréal. Swipez, découvrez, savourez !"
            : "Cuizly vous permet de connecter votre restaurant avec de nouveaux clients grâce à notre plateforme alimentée par l'IA."
          }
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={invitationUrl}
            style={button}
          >
            {userType === 'consumer' ? 'Découvrir Cuizly' : 'Rejoindre en tant que restaurateur'}
          </Link>
        </Section>

        {/* Features */}
        <Text style={text}>
          <strong>Ce qui vous attend :</strong>
        </Text>

        {userType === 'consumer' ? (
          <>
            <Text style={listItem}>• Recommandations personnalisées par IA</Text>
            <Text style={listItem}>• Offres exclusives des meilleurs restaurants</Text>
            <Text style={listItem}>• Interface intuitive de swipe</Text>
            <Text style={listItem}>• Découverte de nouveaux coups de cœur culinaires</Text>
          </>
        ) : (
          <>
            <Text style={listItem}>• Tableau de bord complet pour gérer vos offres</Text>
            <Text style={listItem}>• Analytics détaillées sur vos performances</Text>
            <Text style={listItem}>• Système de gestion des menus</Text>
            <Text style={listItem}>• Accès direct à une clientèle ciblée</Text>
          </>
        )}

        {/* Alternative link */}
        <Text style={smallText}>
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </Text>
        <Text style={linkText}>
          {invitationUrl}
        </Text>

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>

        <Text style={disclaimer}>
          Cette invitation a été envoyée par {inviterName}. Si vous ne souhaitez pas recevoir ce type de courriel, vous pouvez ignorer ce message.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default UserInvitationEmail

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

const messageSection = {
  backgroundColor: '#f0f9ff',
  padding: '20px',
  borderRadius: '12px',
  margin: '20px 0',
  border: '1px solid #bae6fd',
  borderLeft: '4px solid #0ea5e9',
}

const messageText = {
  color: '#0c4a6e',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 10px 0',
  fontStyle: 'italic',
}

const messageAuthor = {
  color: '#0ea5e9',
  fontSize: '14px',
  margin: '0',
  textAlign: 'right' as const,
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