import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

const ContactSectionLanding = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = `mailto:cuizlycanada@gmail.com?subject=${encodeURIComponent(formData.get('subject') as string)}&body=${encodeURIComponent(`De: ${formData.get('firstName')} ${formData.get('lastName')} (${formData.get('email')})\n\nMessage:\n${formData.get('message')}`)}`;
    window.location.href = email;
  };

  return (
    <section id="contact" className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-background to-muted/30 border border-border/50 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Contactez-nous
            </h2>
            <p className="text-xl sm:text-2xl text-foreground/70 max-w-4xl mx-auto leading-relaxed">
              Une question ? Une suggestion ? Nous sommes là pour vous aider.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
            <div>
              <Card className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl sm:text-3xl">Envoyez-nous un message</CardTitle>
                  <CardDescription className="text-base sm:text-lg text-foreground/70">
                    Remplissez le formulaire et nous vous répondrons dans les plus brefs délais.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-base">Prénom</Label>
                        <Input id="firstName" name="firstName" placeholder="Iker" required className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-base">Nom</Label>
                        <Input id="lastName" name="lastName" placeholder="Steen" required className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">Courriel</Label>
                      <Input id="email" name="email" type="email" placeholder="votre@courriel.com" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-base">Sujet</Label>
                      <Input id="subject" name="subject" placeholder="Comment pouvons-nous vous aider ?" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base">Message</Label>
                      <Textarea 
                        id="message" 
                        name="message"
                        placeholder="Décrivez votre demande..."
                        className="min-h-[120px] sm:min-h-[140px] rounded-xl"
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg py-3 rounded-xl shadow-lg">
                      Envoyer le message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8 sm:space-y-12">
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6 sm:mb-8">
                  Informations de contact
                </h3>
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex items-start space-x-4 sm:space-x-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
                      <Mail className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-lg sm:text-xl mb-1">Courriel</h4>
                      <p className="text-foreground/70 text-base sm:text-lg">cuizlycanada@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 sm:space-x-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-lg sm:text-xl mb-1">Adresse</h4>
                      <p className="text-foreground/70 text-base sm:text-lg">2900 Bd Édouard-Montpetit<br />Montréal, QC H3T 1J4</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 sm:space-x-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
                      <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-lg sm:text-xl mb-1">Téléphone</h4>
                      <p className="text-foreground/70 text-base sm:text-lg">+1 (514) 465-4783</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4 sm:mb-6">
                  Heures d'ouverture
                </h3>
                <div className="space-y-2 sm:space-y-3 text-foreground/70 text-base sm:text-lg">
                  <p>Lundi - Vendredi: 9h00 - 18h00</p>
                  <p>Samedi: 10h00 - 16h00</p>
                  <p>Dimanche: Fermé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSectionLanding;