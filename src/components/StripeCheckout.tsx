import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface StripeCheckoutProps {
  priceId: string;
  planName: string;
  planPrice: string;
  className?: string;
  children: React.ReactNode;
}

export const StripeCheckout = ({ priceId, planName, planPrice, className, children }: StripeCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const { user, profile } = useUserProfile();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!user || !profile) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour procéder au paiement.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          customerId: user.id,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?success=true&plan=${planName}`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
          metadata: {
            plan_name: planName,
            plan_price: planPrice,
            user_type: profile.user_type
          }
        }
      });

      if (error) {
        console.error('Erreur lors de la création de la session Stripe:', error);
        toast({
          title: "Erreur de paiement",
          description: "Une erreur est survenue lors de la création de la session de paiement.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Erreur de redirection",
          description: "Impossible de rediriger vers la page de paiement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur Stripe:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      className={className}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirection...
        </>
      ) : (
        children
      )}
    </Button>
  );
};