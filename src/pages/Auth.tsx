import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Mail, Lock, User, Building, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { validatePassword, validateEmail, validateTextInput, INPUT_LIMITS } from "@/lib/validation";
import { isRateLimited } from "@/lib/security";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'consumer' | 'restaurant_owner'>('consumer');
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('signin');
  const hcaptchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useEmailNotifications();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Check URL parameters to set user type and active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const tabParam = urlParams.get('tab');
    
    if (typeParam === 'restaurant') {
      setUserType('restaurant_owner');
    }
    
    if (tabParam === 'signup') {
      setActiveTab('signup');
    }
  }, []);

  useEffect(() => {
    console.log("🔵 [Auth Effect] Initialisation du listener d'authentification");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔵 [Auth State Change] Event:", event);
        console.log("🔵 [Auth State Change] Session présente:", !!session);
        
        if (session?.user) {
          console.log("🔵 [Auth State Change] User ID:", session.user.id);
          console.log("🔵 [Auth State Change] Email:", session.user.email);
          console.log("🔵 [Auth State Change] Provider:", session.user.app_metadata?.provider);
          console.log("🔵 [Auth State Change] User metadata:", session.user.user_metadata);
          console.log("🔵 [Auth State Change] Email confirmé:", !!session.user.email_confirmed_at);
        }
        
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          console.log("🟢 [Auth State Change] Utilisateur connecté, vérification du profil...");
          
          try {
            // Check if user has profile, create if needed
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            console.log("🔵 [Auth State Change] Profil existant:", !!profile);
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.error("🔴 [Auth State Change] Erreur lors de la récupération du profil:", profileError);
            }

            // Si pas de profil, le créer automatiquement
            if (!profile) {
              console.log("🔵 [Auth State Change] Création du profil utilisateur...");
              
              // Si les métadonnées sont présentes, les utiliser
              if (session.user.user_metadata && Object.keys(session.user.user_metadata).length > 0) {
                await createUserProfile(session.user);
              } else {
                // Sinon, créer un profil basique pour utilisateur OAuth
                const { error: createError } = await supabase.from('profiles').insert({
                  user_id: session.user.id,
                  first_name: session.user.user_metadata?.full_name?.split(' ')[0] || 
                             session.user.user_metadata?.name?.split(' ')[0] || 
                             session.user.email?.split('@')[0] || '',
                  last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                            session.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                  user_type: 'consumer' // Par défaut pour OAuth
                });

                if (createError) {
                  console.error("🔴 [Auth State Change] Erreur création profil basique:", createError);
                }
              }
            }

            console.log("🟢 [Auth State Change] Redirection vers /dashboard");
            navigate('/dashboard');
          } catch (error) {
            console.error("🔴 [Auth State Change] Erreur dans la gestion de la connexion:", error);
            // Même en cas d'erreur, rediriger vers le dashboard
            navigate('/dashboard');
          }
        }
      }
    );

    // Check for existing session
    const checkAuth = async () => {
      console.log("🔵 [Auth Effect] Vérification de la session existante");
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("🔴 [Auth Effect] Erreur lors de la vérification de session:", error);
          return;
        }
        
        console.log("🔵 [Auth Effect] Session existante:", !!session);
        
        if (session) {
          console.log("🟢 [Auth Effect] Session trouvée, redirection vers /dashboard");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("🔴 [Auth Effect] Erreur dans checkAuth:", error);
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
        title: t('auth.errors.tooManyAttempts'),
        description: t('auth.errors.pleaseWait'),
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
        title: t('auth.errors.invalidEmail'),
        description: emailValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: t('auth.errors.weakPassword'),
        description: passwordValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const nameValidation = validateTextInput(fullName, INPUT_LIMITS.NAME, 'Nom complet');
    if (!nameValidation.isValid) {
      toast({
        title: t('auth.errors.invalidName'),
        description: nameValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (userType === 'restaurant_owner' && restaurantName) {
      const restaurantNameValidation = validateTextInput(restaurantName, INPUT_LIMITS.NAME, 'Nom du restaurant');
      if (!restaurantNameValidation.isValid) {
        toast({
          title: t('auth.errors.invalidRestaurantName'),
          description: restaurantNameValidation.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    }

    // Vérification hCaptcha
    if (!hcaptchaToken) {
      toast({
        title: t('auth.errors.verificationRequired'),
        description: t('auth.errors.completeCaptcha'),
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          captchaToken: hcaptchaToken,
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
        // Send custom confirmation email via our edge function
        try {
          const { data: confirmationData, error: confirmationError } = await supabase.functions.invoke('send-confirmation-email', {
            body: {
              email: data.user.email!,
              confirmationUrl: `${window.location.origin}/dashboard?token_hash=${data.session?.access_token}&type=signup`,
              userName: nameValidation.sanitized,
              userType: userType,
            },
          });

          if (confirmationError) {
            console.error('Error sending confirmation email:', confirmationError);
          }
        } catch (error) {
          console.error('Error invoking confirmation email function:', error);
        }

        toast({
          title: t('auth.success.accountCreated'),
          description: t('auth.success.checkEmailConfirmation'),
        });
      } else if (data.user) {
        // User is auto-confirmed, create profile and redirect
        await createUserProfile(data.user);
        
        // Send welcome email
        await sendWelcomeEmail({
          email: data.user.email!,
          userName: nameValidation.sanitized,
          userType: userType,
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = t('auth.errors.genericError');
      
      if (error.message?.includes("User already registered")) {
        errorMessage = t('auth.errors.userAlreadyRegistered');
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = t('auth.errors.invalidEmail');
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = t('auth.errors.passwordMinLength');
      }

      toast({
        title: t('auth.errors.signupError'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset hCaptcha
      setHcaptchaToken(null);
      setCaptchaError(null);
      hcaptchaRef.current?.resetCaptcha();
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
        title: t('auth.errors.tooManyAttempts'),
        description: t('auth.errors.pleaseWait'),
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
        title: t('auth.errors.invalidEmail'),
        description: emailValidation.error,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Vérification hCaptcha pour la connexion aussi
    if (!hcaptchaToken) {
      toast({
        title: t('auth.errors.verificationRequired'),
        description: t('auth.errors.completeCaptcha'),
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: hcaptchaToken
        }
      });

      if (error) throw error;

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = t('auth.errors.incorrectCredentials');
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = t('auth.errors.emailOrPasswordIncorrect');
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = t('auth.errors.emailNotConfirmed');
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = t('auth.errors.tooManyRequests');
      }

      toast({
        title: t('auth.errors.signinError'), 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset hCaptcha
      setHcaptchaToken(null);
      setCaptchaError(null);
      hcaptchaRef.current?.resetCaptcha();
    }
  };

  const handleGoogleAuth = async () => {
    console.log("🔵 [Google Auth] Début de la connexion Google");
    
    try {
      setIsLoading(true);
      
      // Log de l'URL de redirection
      const redirectUrl = `${window.location.origin}/dashboard`;
      console.log("🔵 [Google Auth] URL de redirection configurée:", redirectUrl);
      console.log("🔵 [Google Auth] Origin actuel:", window.location.origin);
      
      // Vérification préliminaire de la session actuelle
      const { data: currentSession } = await supabase.auth.getSession();
      console.log("🔵 [Google Auth] Session actuelle avant OAuth:", currentSession?.session ? "Connecté" : "Déconnecté");
      
      console.log("🔵 [Google Auth] Lancement de signInWithOAuth...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      console.log("🔵 [Google Auth] Réponse OAuth reçue");
      console.log("🔵 [Google Auth] Data:", data);
      
      if (error) {
        console.error("🔴 [Google Auth] Erreur OAuth:", error);
        console.error("🔴 [Google Auth] Message d'erreur:", error.message);
        console.error("🔴 [Google Auth] Status:", error.status);
        throw error;
      }
      
      console.log("🟢 [Google Auth] OAuth initié avec succès, redirection en cours...");
      console.log("🟢 [Google Auth] URL générée:", data?.url);
      
    } catch (error: any) {
      console.error("🔴 [Google Auth] Erreur dans handleGoogleAuth:", error);
      
      let errorMessage = "Impossible de se connecter avec Google";
      
      if (error.message?.includes("provider is not enabled")) {
        errorMessage = "Google OAuth n'est pas configuré pour cette application";
        console.error("🔴 [Google Auth] Provider Google non activé");
      } else if (error.message?.includes("invalid_request")) {
        errorMessage = t('auth.errors.oauthConfigInvalid');
        console.error("🔴 [Google Auth] Configuration OAuth invalide");
      } else if (error.message?.includes("redirect_uri")) {
        errorMessage = t('auth.errors.redirectUriUnauthorized');
        console.error("🔴 [Google Auth] Problème avec l'URL de redirection");
      }

      toast({
        title: t('auth.errors.oauthError'),
        description: `${errorMessage} - ${t('auth.errors.checkConsole')}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('navigation.back_home')}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/lovable-uploads/e8fe9351-fe46-440d-914c-b9b28918fe73.png" 
              alt="Cuizly Logo" 
              className="h-16 object-contain dark:hidden"
            />
            <img 
              src="/lovable-uploads/e7e97d69-a6d1-4978-8f05-560def81179e.png" 
              alt="Cuizly Logo" 
              className="h-16 object-contain hidden dark:block"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('auth.title')}</h1>
          <p className="text-cuizly-neutral text-lg">
            {t('auth.subtitle')}
          </p>
        </div>

        <Card className="shadow-card border border-border">
          <CardContent className="p-8 flex items-center justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-lg p-1">
                <TabsTrigger 
                  value="signin" 
                  className="text-sm font-medium rounded-md" 
                  translate="no"
                  onSelect={() => {
                    setHcaptchaToken(null);
                    setCaptchaError(null);
                    setShowSignInPassword(false);
                    setShowSignUpPassword(false);
                    hcaptchaRef.current?.resetCaptcha();
                  }}
                >
                  {t('auth.tabs.signin')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-sm font-medium rounded-md" 
                  translate="no"
                  onSelect={() => {
                    setHcaptchaToken(null);
                    setCaptchaError(null);
                    setShowSignInPassword(false);
                    setShowSignUpPassword(false);
                    hcaptchaRef.current?.resetCaptcha();
                  }}
                >
                  {t('auth.tabs.signup')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm">{t('auth.form.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder={t('auth.form.emailPlaceholder')}
                        className="pl-10 text-sm"
                        autoComplete="new-password"
                        autoFocus={false}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm">{t('auth.form.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signin-password"
                        name="password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 text-sm"
                        autoComplete="new-password"
                        autoFocus={false}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cuizly-neutral hover:text-foreground transition-colors flex items-center justify-center"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        tabIndex={-1}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* hCaptcha pour la connexion */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">{t('auth.form.securityVerification')}</Label>
                    <div className="flex justify-center">
                       <HCaptcha
                         ref={hcaptchaRef}
                         sitekey="30de45b6-4d34-4bd6-99b0-4cea109482b8"
                         onVerify={(token) => {
                           setHcaptchaToken(token);
                           setCaptchaError(null);
                         }}
                         onExpire={() => {
                           setHcaptchaToken(null);
                           setCaptchaError(t('auth.errors.verificationExpired'));
                         }}
                         onError={() => {
                           setHcaptchaToken(null);
                           setCaptchaError(t('auth.errors.verificationError'));
                         }}
                         theme="light"
                         size="normal"
                         languageOverride={currentLanguage}
                       />
                    </div>
                    {captchaError && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-destructive">{captchaError}</p>
                        </div>
                      </div>
                    )}
                    {hcaptchaToken && (
                      <div className="flex items-center text-xs text-green-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t('auth.form.verified')}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full text-sm" disabled={isLoading || !hcaptchaToken}>
                    {isLoading ? t('auth.form.signingIn') : t('auth.form.signin')}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth.form.or')}</span>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm flex items-center justify-center gap-2" 
                    onClick={handleGoogleAuth}
                    type="button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="w-4 h-4">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t('auth.form.continueWithGoogle')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm">{t('auth.form.iAm')}</Label>
                    <RadioGroup
                      value={userType}
                      onValueChange={(value: 'consumer' | 'restaurant_owner') => setUserType(value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consumer" id="consumer" />
                        <Label htmlFor="consumer" className="text-xs sm:text-sm cursor-pointer">
                          {t('auth.form.consumer')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="restaurant_owner" id="restaurant_owner" />
                        <Label htmlFor="restaurant_owner" className="text-xs sm:text-sm cursor-pointer">
                          {t('auth.form.restaurantOwner')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm">{t('auth.form.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder={t('auth.form.fullNamePlaceholder')}
                        className="pl-10 text-sm"
                        autoComplete="new-password"
                        autoFocus={false}
                        required
                      />
                    </div>
                  </div>

                  {userType === 'restaurant_owner' && (
                    <div className="space-y-2">
                      <Label htmlFor="restaurantName" className="text-sm">{t('auth.form.restaurantName')}</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                        <Input
                          id="restaurantName"
                          name="restaurantName"
                          placeholder={t('auth.form.restaurantNamePlaceholder')}
                          className="pl-10 text-sm"
                          autoComplete="new-password"
                          autoFocus={false}
                          required={userType === 'restaurant_owner'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">{t('auth.form.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder={t('auth.form.emailPlaceholder')}
                        className="pl-10 text-sm"
                        autoComplete="new-password"
                        autoFocus={false}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">{t('auth.form.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 text-sm"
                        autoComplete="new-password"
                        autoFocus={false}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cuizly-neutral hover:text-foreground transition-colors flex items-center justify-center"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        tabIndex={-1}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-cuizly-neutral space-y-1">
                    <p>{t('auth.form.passwordRequirements.title')}</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>{t('auth.form.passwordRequirements.minLength')}</li>
                      <li>{t('auth.form.passwordRequirements.uppercase')}</li>
                      <li>{t('auth.form.passwordRequirements.lowercase')}</li>
                      <li>{t('auth.form.passwordRequirements.number')}</li>
                      <li>{t('auth.form.passwordRequirements.special')}</li>
                    </ul>
                  </div>

                  {/* hCaptcha pour l'inscription */}
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">{t('auth.form.securityVerification')}</Label>
                    <div className="flex justify-center">
                       <HCaptcha
                         ref={hcaptchaRef}
                         sitekey="30de45b6-4d34-4bd6-99b0-4cea109482b8"
                         onVerify={(token) => {
                           setHcaptchaToken(token);
                           setCaptchaError(null);
                         }}
                         onExpire={() => {
                           setHcaptchaToken(null);
                           setCaptchaError(t('auth.errors.verificationExpired'));
                         }}
                         onError={() => {
                           setHcaptchaToken(null);
                           setCaptchaError(t('auth.errors.verificationError'));
                         }}
                         theme="light"
                         size="normal"
                         languageOverride={currentLanguage}
                       />
                    </div>
                    {captchaError && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-destructive">{captchaError}</p>
                        </div>
                      </div>
                    )}
                    {hcaptchaToken && (
                      <div className="flex items-center text-xs text-green-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t('auth.form.verified')}
                      </div>
                    )}
                  </div>

                  {userType === 'restaurant_owner' ? (
                    <div className="space-y-3">
                      <Button 
                        type="button" 
                        className="w-full text-sm bg-sky-500 hover:bg-sky-600 text-white"
                        onClick={() => window.open('https://calendly.com/cuizlycanada/30min', '_blank')}
                      >
                        {t('auth.form.bookDemo')}
                      </Button>
                      <Button 
                        type="submit" 
                        className="w-full text-sm opacity-50 cursor-not-allowed" 
                        disabled={true}
                      >
                        {t('auth.form.createAccountInvitation')}
                      </Button>
                    </div>
                  ) : (
                    <Button type="submit" className="w-full text-sm" disabled={isLoading || !hcaptchaToken}>
                      {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                    </Button>
                  )}
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth.form.or')}</span>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm flex items-center justify-center gap-2" 
                    onClick={handleGoogleAuth}
                    type="button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="w-4 h-4">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t('auth.form.continueWithGoogle')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-cuizly-neutral mt-4 sm:mt-6 space-y-2 px-2">
          <p>
            {t('auth.termsText.prefix')}{" "}
            <Link to="/terms" className="underline hover:no-underline">
              {t('auth.termsText.terms')}
            </Link>{" "}
            {t('auth.termsText.and')}{" "}
            <Link to="/privacy" className="underline hover:no-underline">
              {t('auth.termsText.privacy')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;