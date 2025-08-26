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

interface OfferAlertEmailProps {
  userName: string
  restaurantName: string
  offerTitle: string
  offerDescription: string
  discountType: 'percentage' | 'amount'
  discountValue: number
  validUntil?: string
  restaurantCuisine: string[]
  viewOfferUrl: string
}

export const OfferAlertEmail = ({
  userName,
  restaurantName,
  offerTitle,
  offerDescription,
  discountType,
  discountValue,
  validUntil,
  restaurantCuisine,
  viewOfferUrl,
}: OfferAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>🔥 Nouvelle offre exclusive chez {restaurantName} - {offerTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo */}
        <Section style={logoSection}>
          <Img
            src="https://www.cuizly.ca/cuizly-logo.png"
            width="120"
            height="40"
            alt="Cuizly"
            style={logo}
          />
        </Section>

        {/* Header */}
        <Heading style={h1}>
          🔥 Nouvelle offre exclusive !
        </Heading>

        {/* Main content */}
        <Text style={text}>
          Bonjour {userName},
        </Text>

        <Text style={text}>
          Nous avons une excellente nouvelle ! <strong>{restaurantName}</strong> vient de publier une offre spéciale qui pourrait vous intéresser :
        </Text>

        {/* Offer Card */}
        <Section style={offerCard}>
          <Text style={restaurantNameStyle}>
            <strong>{restaurantName}</strong>
          </Text>
          <Text style={cuisineType}>
            {restaurantCuisine.join(' • ')}
          </Text>
          
          <Section style={offerBadge}>
            <Text style={discountText}>
              {discountType === 'percentage' 
                ? `-${discountValue}%`
                : `-${discountValue}$`
              }
            </Text>
          </Section>

          <Text style={offerTitleStyle}>
            <strong>{offerTitle}</strong>
          </Text>
          
          <Text style={offerDescriptionStyle}>
            {offerDescription}
          </Text>

          {validUntil && (
            <Text style={validityText}>
              ⏰ Valide jusqu'au {new Date(validUntil).toLocaleDateString('fr-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          )}
        </Section>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={viewOfferUrl}
            style={button}
          >
            Voir l'offre
          </Link>
        </Section>

        {/* Why this recommendation */}
        <Section style={whySection}>
          <Text style={whyHeader}>
            <strong>🤖 Pourquoi cette recommandation ?</strong>
          </Text>
          <Text style={whyText}>
            Notre IA a sélectionné cette offre en fonction de vos préférences culinaires et de votre historique de découvertes. 
            Plus vous utilisez Cuizly, plus nos recommandations deviennent précises !
          </Text>
        </Section>

        {/* App promotion */}
        <Section style={appSection}>
          <Text style={appText}>
            💡 <strong>Astuce :</strong> Activez les notifications push dans l'app Cuizly pour ne jamais manquer les meilleures offres !
          </Text>
        </Section>

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>

        <Text style={disclaimer}>
          Vous recevez cet email car vous avez activé les alertes d'offres dans vos préférences. Gérez vos notifications dans votre profil.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OfferAlertEmail

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

const offerCard = {
  backgroundColor: '#ffffff',
  padding: '32px',
  borderRadius: '16px',
  margin: '30px 0',
  border: '2px solid #171717',
  position: 'relative' as const,
  textAlign: 'center' as const,
}

const restaurantNameStyle = {
  color: '#171717',
  fontSize: '20px',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const cuisineType = {
  color: '#737373',
  fontSize: '14px',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const offerBadge = {
  backgroundColor: '#dc2626', // Red color for urgency
  color: 'white',
  padding: '12px 20px',
  borderRadius: '50px',
  display: 'inline-block',
  margin: '0 0 20px 0',
}

const discountText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  textAlign: 'center' as const,
}

const offerTitleStyle = {
  color: '#171717',
  fontSize: '18px',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const offerDescriptionStyle = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const validityText = {
  color: '#dc2626', // Red for urgency
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const button = {
  backgroundColor: '#171717', // --cuizly-primary
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  borderRadius: '50px',
  border: 'none',
  cursor: 'pointer',
}

const whySection = {
  backgroundColor: '#f0f9ff', // Light blue background
  padding: '20px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #e0f2fe',
}

const whyHeader = {
  color: '#0369a1', // Blue text
  fontSize: '16px',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const whyText = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}

const appSection = {
  backgroundColor: '#fffbeb', // Light yellow background
  padding: '16px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #fde68a',
}

const appText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
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