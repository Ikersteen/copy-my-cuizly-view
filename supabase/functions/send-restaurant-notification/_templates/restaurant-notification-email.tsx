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

interface RestaurantNotificationEmailProps {
  restaurantName: string
  customerName: string
  notificationType: 'new_review' | 'new_favorite' | 'offer_clicked'
  details?: {
    rating?: number
    comment?: string
    offerTitle?: string
  }
  dashboardUrl: string
}

export const RestaurantNotificationEmail = ({
  restaurantName,
  customerName,
  notificationType,
  details,
  dashboardUrl,
}: RestaurantNotificationEmailProps) => {
  const getNotificationContent = () => {
    switch (notificationType) {
      case 'new_review':
        return {
          title: 'Nouveau commentaire reçu !',
          message: `${customerName} a laissé un commentaire sur votre restaurant.`,
          details: details?.rating ? `Note : ${details.rating}/5 étoiles` : undefined,
          comment: details?.comment,
          cta: 'Voir le commentaire'
        }
      case 'new_favorite':
        return {
          title: 'Nouveau favori ajouté !',
          message: `${customerName} a ajouté ${restaurantName} à ses favoris.`,
          cta: 'Voir votre profil'
        }
      case 'offer_clicked':
        return {
          title: 'Votre offre a été consultée !',
          message: `${customerName} s'intéresse à votre offre "${details?.offerTitle}".`,
          cta: 'Voir les analytics'
        }
      default:
        return {
          title: 'Nouvelle activité',
          message: `Nouvelle activité sur votre restaurant.`,
          cta: 'Voir le tableau de bord'
        }
    }
  }

  const content = getNotificationContent()

  return (
    <Html>
      <Head />
      <Preview>{content.title} - {restaurantName}</Preview>
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
            {content.title}
          </Heading>

          {/* Main content */}
          <Text style={text}>
            Bonjour,
          </Text>

          <Text style={text}>
            {content.message}
          </Text>

          {content.details && (
            <Section style={detailsSection}>
              <Text style={detailsText}>
                <strong>{content.details}</strong>
              </Text>
            </Section>
          )}

          {content.comment && (
            <Section style={commentSection}>
              <Text style={commentHeader}>
                <strong>Commentaire :</strong>
              </Text>
              <Text style={commentText}>
                "{content.comment}"
              </Text>
            </Section>
          )}

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link
              href={dashboardUrl}
              style={button}
            >
              {content.cta}
            </Link>
          </Section>

          {/* Tips section */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>
              <strong>💡 Conseil Cuizly :</strong>
            </Text>
            {notificationType === 'new_review' && (
              <Text style={tipsText}>
                Répondez aux commentaires pour montrer votre engagement envers vos clients et améliorer votre réputation.
              </Text>
            )}
            {notificationType === 'new_favorite' && (
              <Text style={tipsText}>
                Créez des offres spéciales pour fidéliser vos clients favoris et les encourager à revenir.
              </Text>
            )}
            {notificationType === 'offer_clicked' && (
              <Text style={tipsText}>
                C'est le moment parfait pour actualiser vos offres et en créer de nouvelles pour maintenir l'engagement.
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Text style={footer}>
            L'équipe Cuizly<br />
            <em>Ton prochain coup de cœur culinaire en un swipe.</em>
          </Text>

          <Text style={disclaimer}>
            Vous recevez cet email car vous êtes restaurateur partenaire de Cuizly. Gérez vos préférences de notification dans votre tableau de bord.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default RestaurantNotificationEmail

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

const detailsSection = {
  backgroundColor: '#f0f9ff', // Light blue background
  padding: '16px',
  borderRadius: '12px',
  margin: '20px 0',
  border: '1px solid #e0f2fe',
}

const detailsText = {
  color: '#0369a1', // Blue text
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}

const commentSection = {
  backgroundColor: '#fafafa', // --cuizly-surface
  padding: '20px',
  borderRadius: '12px',
  margin: '20px 0',
  border: '1px solid #e5e5e5',
}

const commentHeader = {
  color: '#171717',
  fontSize: '14px',
  margin: '0 0 10px 0',
}

const commentText = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  fontStyle: 'italic',
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

const tipsSection = {
  backgroundColor: '#fffbeb', // Light yellow background
  padding: '20px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #fde68a',
}

const tipsHeader = {
  color: '#92400e', // Yellow-brown text
  fontSize: '14px',
  margin: '0 0 10px 0',
}

const tipsText = {
  color: '#78350f',
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

const disclaimer = {
  color: '#a3a3a3',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
  fontStyle: 'italic',
}