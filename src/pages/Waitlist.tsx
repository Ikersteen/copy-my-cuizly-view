import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Waitlist = () => {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    company_name: "",
    phone: "",
    restaurant_type: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('waitlist_analytics')
        .insert([
          {
            email: formData.email,
            name: formData.name,
            company_name: formData.company_name,
            phone: formData.phone,
            restaurant_type: formData.restaurant_type,
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Inscription réussie à la liste d'attente !");
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="text-center shadow-2xl border-border">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-foreground">
                Inscription confirmée !
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Merci de votre intérêt pour Cuizly Analytics+. Nous vous contacterons bientôt avec plus de détails sur le lancement.
              </p>
              <Link to="/">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-gradient-to-r from-primary/8 to-primary/12 border border-primary/15 px-4 py-2 rounded-full text-sm font-semibold text-primary mb-4">
            <Users className="mr-2 h-4 w-4" />
            Liste d'attente VIP
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Rejoignez la liste d'attente
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Soyez parmi les premiers à accéder à <span className="font-semibold text-primary">Cuizly Analytics+</span> et révolutionnez votre stratégie restaurant avec nos données exclusives.
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-2xl border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">
              Informations de contact
            </CardTitle>
            <p className="text-muted-foreground">
              Remplissez ce formulaire pour être notifié du lancement de Cuizly Analytics+
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Votre nom complet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nom du restaurant</Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Restaurant ABC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(514) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant-type">Type de restaurant</Label>
                <Select value={formData.restaurant_type} onValueChange={(value) => handleChange('restaurant_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de votre restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fine-dining">Restaurant gastronomique</SelectItem>
                    <SelectItem value="casual-dining">Restaurant décontracté</SelectItem>
                    <SelectItem value="fast-casual">Restauration rapide décontractée</SelectItem>
                    <SelectItem value="cafe-bistro">Café / Bistro</SelectItem>
                    <SelectItem value="food-truck">Food Truck</SelectItem>
                    <SelectItem value="bar-pub">Bar / Pub</SelectItem>
                    <SelectItem value="bakery">Boulangerie / Pâtisserie</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Dites-nous en plus sur vos besoins en analytics..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting || !formData.email || !formData.name}
                >
                  {isSubmitting ? "Inscription..." : "Rejoindre la liste d'attente"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pourquoi rejoindre la liste d'attente ?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Accès prioritaire</h4>
              <p className="text-sm text-muted-foreground">
                Soyez parmi les premiers à tester nos fonctionnalités avancées
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Tarif préférentiel</h4>
              <p className="text-sm text-muted-foreground">
                Bénéficiez d'une réduction exclusive pour les early adopters
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Formation incluse</h4>
              <p className="text-sm text-muted-foreground">
                Profitez d'une session de formation personnalisée gratuite
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;