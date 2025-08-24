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
import { validatePassword, validateEmail, validateTextInput, INPUT_LIMITS } from "@/lib/validation";
import { isRateLimited } from "@/lib/security";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'consumer' | 'restaurant_owner'>('consumer');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Check if user has profile, create if needed
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (!profile && session.user.user_metadata) {
            await createUserProfile(session.user);
          }

          navigate('/dashboard');
        }
      }
    );

    // Check for existing session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Rate limiting check
    const clientIP = 'signup'; // Use a general key for client-side rate limiting
    if (isRateLimited(clientIP, 5, 900000)) { // 5 attempts per 15 minutes
      toast({
        title: "Trop de tentatives",
        description: "Veuillez attendre avant de réessayer",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const restaurantName = userType === 'restaurant_owner' ? formData.get('restaurantName') as string : '';

    // Enhanced validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Email invalide",
        description: emailValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Mot de passe invalide",
        description: passwordValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const nameValidation = validateTextInput(fullName, INPUT_LIMITS.NAME, "Full name");
    if (!nameValidation.isValid) {
      toast({
        title: "Nom invalide",
        description: nameValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (userType === 'restaurant_owner') {
      const restaurantValidation = validateTextInput(restaurantName, INPUT_LIMITS.NAME, "Restaurant name");
      if (!restaurantValidation.isValid) {
        toast({
          title: "Nom de restaurant invalide",
          description: restaurantValidation.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: nameValidation.sanitized,
            user_type: userType,
            restaurant_name: userType === 'restaurant_owner' ? validateTextInput(restaurantName, INPUT_LIMITS.NAME).sanitized : null
          }
        }
      });

      if (error) throw error;

      // If user is created and confirmed, create profile
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Compte créé !",
          description: "Vérifiez votre email pour confirmer votre compte.",
        });
      } else if (data.user) {
        // User is auto-confirmed, create profile and redirect
        await createUserProfile(data.user);
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = "Une erreur est survenue";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec cet email";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Adresse email invalide";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      }

      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (user: any) => {
    try {
      const { error } = await supabase.from('profiles').insert({
        user_id: user.id,
        first_name: user.user_metadata.full_name?.split(' ')[0] || '',
        last_name: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
        user_type: user.user_metadata.user_type || 'consumer',
        restaurant_name: user.user_metadata.restaurant_name || null
      });

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      // Si c'est un propriétaire de restaurant, créer automatiquement le restaurant
      if (user.user_metadata.user_type === 'restaurant_owner' && user.user_metadata.restaurant_name) {
        const { error: restaurantError } = await supabase.from('restaurants').insert({
          name: user.user_metadata.restaurant_name,
          owner_id: user.id,
          description: `Bienvenue chez ${user.user_metadata.restaurant_name}`,
          is_active: true
        });

        if (restaurantError) {
          console.error('Error creating restaurant:', restaurantError);
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Rate limiting check
    const clientIP = 'signin'; // Use a general key for client-side rate limiting
    if (isRateLimited(clientIP, 5, 900000)) { // 5 attempts per 15 minutes
      toast({
        title: "Trop de tentatives",
        description: "Veuillez attendre avant de réessayer",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Enhanced validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Email invalide",
        description: emailValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = "Identifiants incorrects";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter";
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = "Trop de tentatives, veuillez réessayer plus tard";
      }

      toast({
        title: "Erreur de connexion", 
        description: errorMessage,
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
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      let errorMessage = "Impossible de se connecter avec Google";
      
      if (error.message?.includes("provider is not enabled")) {
        errorMessage = "Google OAuth n'est pas configuré pour cette application";
      }

      toast({
        title: "Erreur OAuth",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAppleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      let errorMessage = "Impossible de se connecter avec Apple";
      
      if (error.message?.includes("provider is not enabled")) {
        errorMessage = "Apple OAuth n'est pas configuré pour cette application";
      }

      toast({
        title: "Erreur OAuth",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-foreground rounded-full flex items-center justify-center">
              <span className="text-background font-bold text-base sm:text-lg">C</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold">Cuizly</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Rejoignez Cuizly</h1>
          <p className="text-cuizly-neutral text-base sm:text-lg px-2 sm:px-0">
            Ton prochain coup de cœur culinaire en un swipe
          </p>
        </div>

        <Card className="shadow-card border border-border">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="signin" className="text-sm">Connexion</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm">Courriel</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="votre@courriel.com"
                        className="pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-sm" disabled={isLoading}>
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

                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={handleGoogleAuth}
                    type="button"
                  >
                    Se connecter avec Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={handleAppleAuth}
                    type="button"
                  >
                    Se connecter avec Apple
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm">Je suis</Label>
                    <RadioGroup
                      value={userType}
                      onValueChange={(value: 'consumer' | 'restaurant_owner') => setUserType(value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consumer" id="consumer" />
                        <Label htmlFor="consumer" className="text-xs sm:text-sm cursor-pointer">
                          Consommateur
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="restaurant_owner" id="restaurant_owner" />
                        <Label htmlFor="restaurant_owner" className="text-xs sm:text-sm cursor-pointer">
                          Restaurateur
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="John Doe"
                        className="pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {userType === 'restaurant_owner' && (
                    <div className="space-y-2">
                      <Label htmlFor="restaurantName" className="text-sm">Nom du restaurant</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                        <Input
                          id="restaurantName"
                          name="restaurantName"
                          placeholder="Mon Restaurant"
                          className="pl-10 text-sm"
                          required={userType === 'restaurant_owner'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">Courriel</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="votre@courriel.com"
                        className="pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 text-sm"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-sm" disabled={isLoading}>
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

                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={handleGoogleAuth}
                    type="button"
                  >
                    Continuer avec Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
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

        <div className="text-center text-xs text-cuizly-neutral mt-4 sm:mt-6 space-y-2 px-2">
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