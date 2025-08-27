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

interface WeeklyDigestEmailProps {
  userName: string
  userType: 'consumer' | 'restaurant_owner'
  stats: {
    newRestaurants?: number
    newOffers?: number
    favoriteRestaurants?: number
    // For restaurant owners
    profileViews?: number
    newFavorites?: number
    offerClicks?: number
  }
  recommendations?: Array<{
    name: string
    cuisine: string
    offer?: string
  }>
  dashboardUrl: string
}

export const WeeklyDigestEmail = ({
  userName,
  userType,
  stats,
  recommendations = [],
  dashboardUrl,
}: WeeklyDigestEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {userType === 'consumer' 
        ? 'Votre digest hebdomadaire Cuizly - Nouvelles découvertes culinaires'
        : 'Votre rapport hebdomadaire Cuizly - Performance de votre restaurant'
      }
    </Preview>
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
          {userType === 'consumer' 
            ? `Votre semaine gourmande, ${userName} !`
            : `Votre rapport hebdomadaire, ${userName}`
          }
        </Heading>

        {/* Main content */}
        <Text style={text}>
          {userType === 'consumer'
            ? "Découvrez ce qui s'est passé cette semaine dans l'univers culinaire montréalais :"
            : "Voici un résumé de l'activité de votre restaurant cette semaine :"
          }
        </Text>

        {/* Stats Section */}
        <Section style={statsSection}>
          <Text style={statsHeader}>
            <strong>📊 Cette semaine en chiffres</strong>
          </Text>
          
          {userType === 'consumer' ? (
            <div>
              {stats.newRestaurants && (
                <Text style={statItem}>
                  🏪 <strong>{stats.newRestaurants}</strong> nouveaux restaurants découverts
                </Text>
              )}
              {stats.newOffers && (
                <Text style={statItem}>
                  🏷️ <strong>{stats.newOffers}</strong> nouvelles offres disponibles
                </Text>
              )}
              {stats.favoriteRestaurants && (
                <Text style={statItem}>
                  ⭐ <strong>{stats.favoriteRestaurants}</strong> restaurants dans vos favoris
                </Text>
              )}
            </div>
          ) : (
            <div>
              {stats.profileViews && (
                <Text style={statItem}>
                  👀 <strong>{stats.profileViews}</strong> vues de profil
                </Text>
              )}
              {stats.newFavorites && (
                <Text style={statItem}>
                  ⭐ <strong>{stats.newFavorites}</strong> nouveaux favoris
                </Text>
              )}
              {stats.offerClicks && (
                <Text style={statItem}>
                  🏷️ <strong>{stats.offerClicks}</strong> clics sur vos offres
                </Text>
              )}
            </div>
          )}
        </Section>

        {/* Recommendations Section */}
        {recommendations.length > 0 && userType === 'consumer' && (
          <Section style={recommendationsSection}>
            <Text style={sectionHeader}>
              <strong>🤖 Recommandations personnalisées</strong>
            </Text>
            <Text style={text}>
              Notre IA a sélectionné ces restaurants pour vous :
            </Text>
            {recommendations.slice(0, 3).map((restaurant, index) => (
              <Section key={index} style={restaurantCard}>
                <Text style={restaurantName}>
                  <strong>{restaurant.name}</strong>
                </Text>
                <Text style={restaurantCuisine}>
                  {restaurant.cuisine}
                </Text>
                {restaurant.offer && (
                  <Text style={restaurantOffer}>
                    🏷️ {restaurant.offer}
                  </Text>
                )}
              </Section>
            ))}
          </Section>
        )}

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={dashboardUrl}
            style={button}
          >
            {userType === 'consumer' 
              ? 'Découvrir plus de restaurants'
              : 'Voir le tableau de bord complet'
            }
          </Link>
        </Section>

        {/* Tips Section */}
        <Section style={tipsSection}>
          <Text style={tipsHeader}>
            <strong>💡 Conseil de la semaine</strong>
          </Text>
          {userType === 'consumer' ? (
            <Text style={tipsText}>
              Essayez de découvrir un nouveau type de cuisine cette semaine ! Notre algorithme s'améliore avec chacune de vos interactions.
            </Text>
          ) : (
            <Text style={tipsText}>
              Créez des offres limitées dans le temps pour créer un sentiment d'urgence et augmenter l'engagement de vos clients.
            </Text>
          )}
        </Section>

        {/* Footer */}
        <Text style={footer}>
          L'équipe Cuizly<br />
          <em>Ton prochain coup de cœur culinaire en un swipe.</em>
        </Text>

        <Text style={disclaimer}>
          Vous recevez ce digest hebdomadaire car vous êtes membre de Cuizly. Gérez vos préférences email dans vos paramètres.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WeeklyDigestEmail

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

const statsSection = {
  backgroundColor: '#fafafa', // --cuizly-surface
  padding: '24px',
  borderRadius: '12px',
  margin: '30px 0',
  border: '1px solid #e5e5e5',
}

const statsHeader = {
  color: '#171717',
  fontSize: '18px',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const statItem = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const sectionHeader = {
  color: '#171717',
  fontSize: '18px',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const recommendationsSection = {
  margin: '30px 0',
}

const restaurantCard = {
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '8px',
  margin: '0 0 12px 0',
  border: '1px solid #e5e5e5',
}

const restaurantName = {
  color: '#171717',
  fontSize: '16px',
  margin: '0 0 4px 0',
}

const restaurantCuisine = {
  color: '#737373',
  fontSize: '14px',
  margin: '0 0 8px 0',
}

const restaurantOffer = {
  color: '#059669', // Green color for offers
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
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
  fontSize: '16px',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const tipsText = {
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