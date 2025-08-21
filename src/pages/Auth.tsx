import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Mail, Lock, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'consumer' | 'restaurant_owner'>('consumer');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const restaurantName = userType === 'restaurant_owner' ? formData.get('restaurantName') as string : '';

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            user_type: userType,
            restaurant_name: restaurantName
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Compte créé !",
        description: "Vérifiez votre email pour confirmer votre compte.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Identifiants incorrects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se connecter avec Google",
        variant: "destructive",
      });
    }
  };

  const handleAppleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se connecter avec Apple",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-cuizly-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">C</span>
            </div>
            <span className="text-lg font-semibold">Cuizly</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rejoignez Cuizly</h1>
          <p className="text-cuizly-neutral mt-2">
            Découvrez les meilleures offres culinaires de Montréal
          </p>
        </div>

        <Card className="shadow-card border border-border">
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleAuth}
                    type="button"
                  >
                    Se connecter avec Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleAppleAuth}
                    type="button"
                  >
                    Se connecter avec Apple
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-3">
                    <Label>Je suis</Label>
                    <RadioGroup
                      value={userType}
                      onValueChange={(value: 'consumer' | 'restaurant_owner') => setUserType(value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consumer" id="consumer" />
                        <Label htmlFor="consumer" className="text-sm cursor-pointer">
                          Consommateur
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="restaurant_owner" id="restaurant_owner" />
                        <Label htmlFor="restaurant_owner" className="text-sm cursor-pointer">
                          Restaurateur
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="John Doe"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {userType === 'restaurant_owner' && (
                    <div className="space-y-2">
                      <Label htmlFor="restaurantName">Nom du restaurant</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                        <Input
                          id="restaurantName"
                          name="restaurantName"
                          placeholder="Mon Restaurant"
                          className="pl-10"
                          required={userType === 'restaurant_owner'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Création..." : "Créer mon compte"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleAuth}
                    type="button"
                  >
                    Continuer avec Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleAppleAuth}
                    type="button"
                  >
                    Continuer avec Apple
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-cuizly-neutral mt-6 space-y-2">
          <p>
            En vous inscrivant, vous acceptez nos{" "}
            <Link to="/terms" className="underline hover:no-underline">
              conditions d'utilisation
            </Link>{" "}
            et notre{" "}
            <Link to="/privacy" className="underline hover:no-underline">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;