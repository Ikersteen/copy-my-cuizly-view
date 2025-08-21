import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const Legal = () => {
  const legalPages = [
    {
      title: "Politique de confidentialité",
      description: "Comment nous collectons, utilisons et protégeons vos données personnelles.",
      path: "/privacy"
    },
    {
      title: "Conditions d'utilisation",
      description: "Les règles et conditions d'utilisation de notre plateforme.",
      path: "/terms"
    },
    {
      title: "Mentions légales",
      description: "Informations légales obligatoires et identification de l'éditeur.",
      path: "/mentions"
    },
    {
      title: "Politique des cookies",
      description: "Informations sur l'utilisation des cookies sur notre site.",
      path: "/cookies"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Informations légales
          </h1>
          <p className="text-xl text-cuizly-neutral">
            Consultez nos documents légaux et politiques de confidentialité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {legalPages.map((page, index) => (
            <Link key={index} to={page.path}>
              <Card className="shadow-card border border-border hover:shadow-elevated transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {page.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-cuizly-neutral">
                    {page.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Legal;