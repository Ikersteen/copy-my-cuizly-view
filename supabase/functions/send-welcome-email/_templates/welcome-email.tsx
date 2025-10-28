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

interface WelcomeEmailProps {
  userName: string
  userType: 'consumer' | 'restaurant_owner'
  loginUrl: string
}

export const WelcomeEmail = ({
  userName,
  userType,
  loginUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue sur Cuizly - Ton prochain coup de cœur culinaire en un swipe.</Preview>
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
          Bienvenue sur Cuizly, {userName} !
        </Heading>

        {/* Main content */}
        <Text style={text}>
          {userType === 'consumer' 
            ? "Nous sommes ravis de vous accueillir dans la communauté des gourmets montréalais."
            : "Nous sommes ravis de vous accueillir parmi nos partenaires restaurateurs."
          }
        </Text>

        <Text style={text}>
          {userType === 'consumer'
            ? "Découvrez les meilleures offres culinaires de Montréal grâce à notre plateforme alimentée par l'IA. Swipez, découvrez, savourez !"
            : "Connectez-vous avec de nouveaux clients et faites découvrir votre cuisine exceptionnelle à travers notre plateforme innovante."
          }
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={loginUrl}
            style={button}
          >
            {userType === 'consumer' ? 'Découvrir les restaurants' : 'Accéder à mon tableau de bord'}
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
            <Text style={listItem}>• Historique de vos découvertes culinaires</Text>
          </>
        ) : (
          <>
            <Text style={listItem}>• Tableau de bord complet pour gérer vos offres</Text>
            <Text style={listItem}>• Analytics détaillées sur vos performances</Text>
            <Text style={listItem}>• Système de gestion des menus</Text>
            <Text style={listItem}>• Accès direct à votre clientèle cible</Text>
          </>
        )}

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>

        <Text style={socialLinks}>
          <Link href="https://www.linkedin.com/company/cuizly" target="_blank" style={socialLink}>
            LinkedIn
          </Link>
          {' | '}
          <Link href="https://www.instagram.com/cuizly" target="_blank" style={socialLink}>
            Instagram
          </Link>
          {' | '}
          <Link href="https://www.tiktok.com/@cuizly" target="_blank" style={socialLink}>
            TikTok
          </Link>
        </Text>

        <Text style={disclaimer}>
          Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email en toute sécurité.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

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

const socialLinks = {
  color: '#737373',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '10px',
  marginBottom: '0',
}

const socialLink = {
  color: '#171717',
  textDecoration: 'none',
  fontWeight: '600',
}

const disclaimer = {
  color: '#a3a3a3',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
  fontStyle: 'italic',
}