import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";

const EmailFunctionTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const testEmailFunctions = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log("🧪 Calling test-email-functions...");
      
      const { data, error } = await supabase.functions.invoke('test-email-functions', {
        body: {}
      });

      if (error) {
        console.error("❌ Test function error:", error);
        toast({
          title: "Erreur de test",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("✅ Test results:", data);
      setTestResults(data);
      
      toast({
        title: "Test des emails terminé",
        description: "Vérifiez les résultats ci-dessous",
        variant: "default"
      });
    } catch (err: any) {
      console.error("🚫 Unexpected error:", err);
      toast({
        title: "Erreur inattendue",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status.includes("Success")) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Succès</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échec</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Test des fonctions d'emails Cuizly
          </CardTitle>
          <CardDescription>
            Testez toutes les fonctions d'emails pour vérifier qu'elles fonctionnent correctement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testEmailFunctions} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Lancer le test des emails
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium">Email de bienvenue</span>
                {getStatusBadge(testResults.results?.welcome_email || "❌ Failed")}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium">Notification restaurant</span>
                {getStatusBadge(testResults.results?.restaurant_notification || "❌ Failed")}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium">Alerte offre</span>
                {getStatusBadge(testResults.results?.offer_alert || "❌ Failed")}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold mb-2">Statut global :</h4>
              <p className="text-lg">{testResults.results?.overall || "❌ Échec"}</p>
            </div>

            {testResults.message && (
              <p className="text-sm text-muted-foreground">{testResults.message}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailFunctionTester;