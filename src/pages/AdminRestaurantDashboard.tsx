import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  Eye,
  Filter,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string | null;
  email: string | null;
  cuisine_type: string[];
  price_range: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const MONTREAL_ZONES = [
  { value: 'all', label: 'Toutes les zones' },
  { value: 'centre-ville', label: 'Centre-ville' },
  { value: 'plateau', label: 'Plateau Mont-Royal' },
  { value: 'rosemont', label: 'Rosemont-La Petite-Patrie' },
  { value: 'villeray', label: 'Villeray-Saint-Michel' },
  { value: 'repentigny', label: 'Repentigny' },
  { value: 'other', label: 'Autres secteurs' }
];

const PRICE_RANGES = [
  { value: 'budget', label: '$ - Budget' },
  { value: 'moderate', label: '$$ - Modéré' },
  { value: 'expensive', label: '$$$ - Cher' },
  { value: 'very_expensive', label: '$$$$ - Très cher' }
];

export default function AdminRestaurantDashboard() {
  const { user, isAuthenticated, loading } = useUserProfile();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error('Vous devez être connecté pour accéder à cette page');
      navigate("/auth");
    }
  }, [loading, isAuthenticated, navigate]);

  // Load restaurants
  useEffect(() => {
    if (isAuthenticated) {
      loadRestaurants();
    }
  }, [isAuthenticated]);

  // Filter restaurants
  useEffect(() => {
    let filtered = [...restaurants];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine_type.some(cuisine => 
          cuisine.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Zone filter (simple address matching)
    if (selectedZone !== 'all') {
      filtered = filtered.filter(restaurant => {
        const address = restaurant.address.toLowerCase();
        switch (selectedZone) {
          case 'centre-ville':
            return address.includes('downtown') || address.includes('centre-ville') || address.includes('montreal');
          case 'plateau':
            return address.includes('plateau');
          case 'rosemont':
            return address.includes('rosemont');
          case 'villeray':
            return address.includes('villeray');
          case 'repentigny':
            return address.includes('repentigny');
          default:
            return true;
        }
      });
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter(restaurant => 
        restaurant.price_range === selectedPriceRange
      );
    }

    // Active status filter
    if (showActiveOnly) {
      filtered = filtered.filter(restaurant => restaurant.is_active);
    }

    setFilteredRestaurants(filtered);
  }, [restaurants, searchTerm, selectedZone, selectedPriceRange, showActiveOnly]);

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      
      // Use the public function to get restaurants
      const { data, error } = await supabase
        .rpc('get_public_restaurants');

      if (error) {
        console.error('Erreur chargement restaurants:', error);
        toast.error('Erreur lors du chargement des restaurants');
        return;
      }

      setRestaurants(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRestaurantStatus = async (restaurantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: !currentStatus })
        .eq('id', restaurantId);

      if (error) {
        console.error('Erreur changement statut:', error);
        toast.error('Erreur lors du changement de statut');
        return;
      }

      toast.success(`Restaurant ${!currentStatus ? 'activé' : 'désactivé'}`);
      loadRestaurants(); // Reload to refresh data
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const deleteRestaurant = async (restaurantId: string, restaurantName: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) {
        console.error('Erreur suppression:', error);
        toast.error('Erreur lors de la suppression');
        return;
      }

      toast.success(`Restaurant "${restaurantName}" supprimé`);
      loadRestaurants(); // Reload to refresh data
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Show loading while checking authentication
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="space-y-2">
            <p className="text-cuizly-neutral font-medium">Chargement du dashboard...</p>
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Dashboard Restaurants
          </h1>
          <p className="text-muted-foreground">
            Gérez vos restaurants importés - {filteredRestaurants.length} restaurant(s) affiché(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/admin/import-restaurants')}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Importer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, adresse, cuisine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zone / Quartier</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTREAL_ZONES.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gamme de prix</Label>
              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les prix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les prix</SelectItem>
                  {PRICE_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              />
              <Label htmlFor="active-only" className="text-sm">
                Actifs seulement
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {restaurants.length}
            </div>
            <p className="text-sm text-muted-foreground">Total restaurants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {restaurants.filter(r => r.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {restaurants.filter(r => !r.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Inactifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {filteredRestaurants.length}
            </div>
            <p className="text-sm text-muted-foreground">Affichés</p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant List */}
      <div className="grid gap-4">
        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Aucun restaurant trouvé avec les filtres actuels.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                      <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                        {restaurant.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      {restaurant.price_range && (
                        <Badge variant="outline">
                          {PRICE_RANGES.find(p => p.value === restaurant.price_range)?.label || restaurant.price_range}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {restaurant.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{restaurant.address}</span>
                        </div>
                      )}

                      {restaurant.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{restaurant.phone}</span>
                        </div>
                      )}

                      {restaurant.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{restaurant.email}</span>
                        </div>
                      )}

                      {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">Cuisine:</span>
                          {restaurant.cuisine_type.map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {restaurant.description && (
                        <p className="text-sm mt-2 line-clamp-2">
                          {restaurant.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                    >
                      {restaurant.is_active ? 'Désactiver' : 'Activer'}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le restaurant</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{restaurant.name}" ? 
                            Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRestaurant(restaurant.id, restaurant.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}