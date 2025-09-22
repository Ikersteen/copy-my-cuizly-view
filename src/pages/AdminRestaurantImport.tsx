import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, MapPin, Clock, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface ImportResult {
  success: number;
  errors: number;
  total: number;
  logs: string[];
}

export default function AdminRestaurantImport() {
  const { user, isAuthenticated, loading } = useUserProfile();
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [maxResults, setMaxResults] = useState(5);
  const [location, setLocation] = useState('Montreal, QC, Canada');
  const [radius, setRadius] = useState(5);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error('Vous devez être connecté pour accéder à cette page');
      navigate("/auth");
    }
  }, [loading, isAuthenticated, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="space-y-2">
            <p className="text-cuizly-neutral font-medium">Vérification des permissions...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const handleImport = async () => {
    if (!location.trim()) {
      toast.error('Veuillez spécifier une localisation');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      console.log('🚀 Lancement de l\'importation de restaurants');
      
      const { data, error } = await supabase.functions.invoke('import-restaurants-google', {
        body: {
          location: location.trim(),
          radius: radius,
          maxResults: testMode ? Math.min(maxResults, 10) : maxResults,
          testMode: testMode
        }
      });

      if (error) {
        console.error('❌ Erreur lors de l\'importation:', error);
        throw error;
      }

      if (data) {
        setImportResult(data);
        toast.success(`Importation terminée ! ${data.success} restaurants importés`);
      }

    } catch (error) {
      console.error('❌ Erreur d\'importation:', error);
      toast.error('Erreur lors de l\'importation des restaurants');
    } finally {
      setIsImporting(false);
      setProgress(100);
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      console.log('🧪 Test de l\'API Google Maps');
      
      const { data, error } = await supabase.functions.invoke('test-google-api');

      if (error) {
        console.error('❌ Erreur lors du test:', error);
        throw error;
      }

      setApiTestResult(data);
      
      if (data.success) {
        toast.success('API Google Maps fonctionne correctement !');
      } else {
        toast.error(`Erreur API: ${data.error}`);
      }

    } catch (error) {
      console.error('❌ Erreur test API:', error);
      toast.error('Erreur lors du test de l\'API');
      setApiTestResult({ success: false, error: error.message });
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Importation de Restaurants
        </h1>
        <p className="text-muted-foreground">
          Importez des restaurants depuis Google Places API pour enrichir votre base de données
        </p>
      </div>

      {/* Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Configuration de l'importation
          </CardTitle>
          <CardDescription>
            Configurez les paramètres pour l'importation de restaurants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ex: Montreal, QC, Canada"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Rayon (kilomètres)</Label>
              <Input
                id="radius"
                type="number"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                min="1"
                max="50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="test-mode">Mode Test</Label>
                <Badge variant={testMode ? "secondary" : "destructive"}>
                  {testMode ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Limite l'importation à {maxResults} restaurants pour les tests
              </p>
            </div>
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>

          {testMode && (
            <div className="space-y-2">
              <Label htmlFor="max-results">Nombre de restaurants (test)</Label>
              <Input
                id="max-results"
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert de sécurité */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important :</strong> Cette opération ajoutera de nouveaux restaurants à votre base de données. 
          En mode test, seuls {maxResults} restaurants seront importés. 
          Les restaurants importés seront assignés à l'administrateur actuel.
        </AlertDescription>
      </Alert>

      {/* Test API et Bouton d'import */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Bouton de test API */}
            <Button
              onClick={handleTestApi}
              disabled={isTestingApi || isImporting}
              variant="outline"
              className="w-full md:w-auto"
            >
              {isTestingApi ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Tester l'API Google Maps
                </>
              )}
            </Button>

            {/* Bouton d'import principal */}
            <Button
              onClick={handleImport}
              disabled={isImporting || isTestingApi}
              size="lg"
              className="w-full md:w-auto"
            >
              {isImporting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Importation en cours...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  {testMode ? 'Lancer le test d\'importation' : 'Importer les restaurants'}
                </>
              )}
            </Button>
            
            {isImporting && (
              <div className="w-full max-w-md">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Importation en cours...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats du test API */}
      {apiTestResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {apiTestResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test de l'API Google Maps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={apiTestResult.success ? "default" : "destructive"}>
                  {apiTestResult.success ? "✅ SUCCÈS" : "❌ ÉCHEC"}
                </Badge>
              </div>
              
              {apiTestResult.status && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Code HTTP:</span>
                  <code className="bg-muted px-2 py-1 rounded">{apiTestResult.status}</code>
                </div>
              )}
              
              {apiTestResult.error && (
                <div className="space-y-2">
                  <span className="font-medium text-red-600">Erreur:</span>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <code className="text-red-800 text-sm">{apiTestResult.error}</code>
                  </div>
                </div>
              )}
              
              {apiTestResult.googleResponse && apiTestResult.googleResponse.results && (
                <div className="space-y-2">
                  <span className="font-medium text-green-600">Résultats trouvés:</span>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      {apiTestResult.googleResponse.results.length} restaurants trouvés à proximité
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Résultats de l'importation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.success}
                </div>
                <div className="text-sm text-muted-foreground">Réussis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errors}
                </div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.total}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {importResult.logs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Logs d'importation :</h4>
                <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                  {importResult.logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}