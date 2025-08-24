import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Terms = () => {
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
          Conditions d'utilisation
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptation des conditions</h2>
            <p className="text-cuizly-neutral">
              En accédant et en utilisant Cuizly, vous acceptez d'être lié par ces conditions d'utilisation et toutes les lois et réglementations applicables.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description du service</h2>
            <p className="text-cuizly-neutral">
              Cuizly est une plateforme qui connecte les consommateurs aux restaurants à Montréal en proposant des offres culinaires personnalisées grâce à l'intelligence artificielle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Responsabilités de l'utilisateur</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li>Fournir des informations exactes lors de l'inscription</li>
              <li>Maintenir la sécurité de votre compte</li>
              <li>Utiliser le service de manière légale et respectueuse</li>
              <li>Ne pas perturber le fonctionnement de la plateforme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Propriété intellectuelle</h2>
            <p className="text-cuizly-neutral">
              Tout le contenu de Cuizly, y compris les textes, graphiques, logos et logiciels, est la propriété de Cuizly Technologie Inc. et est protégé par les lois sur la propriété intellectuelle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibent text-foreground mb-4">5. Limitation de responsabilité</h2>
            <p className="text-cuizly-neutral">
              Cuizly ne peut être tenu responsable des dommages indirects, incidents ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser notre service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Modifications</h2>
            <p className="text-cuizly-neutral">
              Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Les modifications entreront en vigueur immédiatement après leur publication sur cette page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Responsabilité</h2>
            <p className="text-cuizly-neutral">
              Cuizly Technologies Inc. ne peut être tenue responsable des dommages directs ou indirects résultant de l'utilisation de notre plateforme. Pour exercer ce droit, contactez-nous à cuizlycanada@gmail.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact</h2>
            <p className="text-cuizly-neutral">
              Pour toute question concernant ces conditions d'utilisation, contactez-nous à :
              <br />Courriel : cuizlycanada@gmail.com
              <br />Adresse : 2900 Bd Édouard-Montpetit
              <br />Montréal, QC H3T 1J4
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;