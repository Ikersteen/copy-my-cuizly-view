import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-8">
          Politique de confidentialité
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-cuizly-neutral">
              Cuizly Technologie Inc. ("nous", "notre" ou "Cuizly") respecte votre vie privée et s'engage à protéger vos données personnelles. Cette politique de confidentialité vous informe sur la façon dont nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Informations que nous collectons</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li>Informations d'identification personnelle (nom, email)</li>
              <li>Préférences culinaires et alimentaires</li>
              <li>Données de localisation (avec votre consentement)</li>
              <li>Informations d'utilisation et analytiques</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Comment nous utilisons vos informations</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li>Fournir et améliorer nos services</li>
              <li>Personnaliser votre expérience</li>
              <li>Vous envoyer des notifications pertinentes</li>
              <li>Analyser l'utilisation de notre plateforme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Partage d'informations</h2>
            <p className="text-cuizly-neutral mb-4">
              Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. Nous pouvons partager vos informations dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li>Avec votre consentement explicite</li>
              <li>Pour se conformer aux obligations légales</li>
              <li>Pour protéger nos droits et notre sécurité</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Vos droits</h2>
            <p className="text-cuizly-neutral">
              Vous avez le droit d'accéder, de corriger, de supprimer ou de limiter l'utilisation de vos données personnelles. Pour exercer ces droits, contactez-nous à privacy@cuizly.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact</h2>
            <p className="text-cuizly-neutral">
              Pour toute question concernant cette politique de confidentialité, contactez-nous à :
              <br />Email : privacy@cuizly.com
              <br />Adresse : Montréal, Québec, Canada
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;