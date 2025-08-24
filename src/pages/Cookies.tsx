import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Cookies = () => {
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
          Politique des cookies
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-cuizly-neutral mb-6">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-CA')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Qu'est-ce qu'un cookie ?</h2>
            <p className="text-cuizly-neutral">
              Un cookie est un petit fichier texte déposé sur votre ordinateur lors de la visite d'un site web. Il permet de reconnaître votre navigateur et de conserver certaines informations sur vos préférences ou actions passées.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Types de cookies utilisés</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Cookies essentiels</h3>
              <p className="text-cuizly-neutral">
                Ces cookies sont nécessaires au fonctionnement du site. Ils vous permettent de naviguer sur le site et d'utiliser ses fonctionnalités essentielles comme l'authentification et la sécurité.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Cookies de performance</h3>
              <p className="text-cuizly-neutral">
                Ces cookies collectent des informations sur la façon dont vous utilisez notre site, comme les pages les plus visitées. Ces données nous aident à améliorer le fonctionnement du site.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Cookies de fonctionnalité</h3>
              <p className="text-cuizly-neutral">
                Ces cookies permettent au site de se souvenir de vos choix (comme votre nom d'utilisateur ou votre langue) et de fournir des fonctionnalités améliorées et plus personnalisées.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Gestion des cookies</h2>
            <p className="text-cuizly-neutral mb-4">
              Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez supprimer tous les cookies qui sont déjà sur votre ordinateur et vous pouvez configurer la plupart des navigateurs pour empêcher leur placement.
            </p>
            
            <p className="text-cuizly-neutral mb-4">
              Cependant, si vous faites cela, vous devrez peut-être ajuster manuellement certaines préférences à chaque fois que vous visitez un site et certains services et fonctionnalités peuvent ne pas fonctionner.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Comment désactiver les cookies</h2>
            <ul className="list-disc pl-6 space-y-2 text-cuizly-neutral">
              <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies et autres données de site</li>
              <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies et données de site</li>
              <li><strong>Safari :</strong> Préférences → Confidentialité → Gérer les données de site web</li>
              <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site → Gérer et supprimer les cookies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies tiers</h2>
            <p className="text-cuizly-neutral">
              Certains cookies peuvent être placés par des services tiers que nous utilisons, comme Google Analytics pour mesurer l'audience du site. Ces services tiers ont leurs propres politiques de confidentialité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Éditeur du site</h2>
            <p className="text-cuizly-neutral">
              Raison sociale : Cuizly Technologies
              <br />Forme juridique : Startup Indépendante
              <br />Siège social : 2900 Bd Édouard-Montpetit, Montréal, QC H3T 1J4
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Directeur de la publication</h2>
            <p className="text-cuizly-neutral">
              Iker Kiomba Landu, Président Directeur Général
              <br />Courriel : cuizlycanada@gmail.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact</h2>
            <p className="text-cuizly-neutral">
              Pour toute question concernant notre utilisation des cookies, contactez-nous à :
              <br />Courriel : cuizlycanada@gmail.com
              <br />Siège social : 2900 Bd Édouard-Montpetit, Montréal, QC H3T 1J4
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cookies;