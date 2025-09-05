import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type?: string;
  dietary_restrictions?: string[];
  allergens?: string[];
  is_active: boolean;
  created_at: string;
}

export default function ManageMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useProfile();

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get restaurant ID for the current user
      const { data: restaurants, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError);
        return;
      }

      if (!restaurants) {
        toast({
          title: t('common.error'),
          description: t('dashboard.completeProfile'),
          variant: "destructive"
        });
        return;
      }

      // Get menus for this restaurant
      const { data: menusData, error: menusError } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurants.id)
        .order('created_at', { ascending: false });

      if (menusError) {
        console.error('Error fetching menus:', menusError);
        toast({
          title: t('common.error'),
          description: 'Erreur lors du chargement des menus',
          variant: "destructive"
        });
        return;
      }

      setMenus(menusData || []);
    } catch (error) {
      console.error('Error loading menus:', error);
      toast({
        title: t('common.error'),
        description: 'Erreur lors du chargement des menus',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = async (menuId: string) => {
    try {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', menuId);

      if (error) {
        console.error('Error deleting menu:', error);
        toast({
          title: t('common.error'),
          description: 'Erreur lors de la suppression du menu',
          variant: "destructive"
        });
        return;
      }

      toast({
        title: t('common.success'),
        description: 'Menu supprimé avec succès',
      });

      loadMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast({
        title: t('common.error'),
        description: 'Erreur lors de la suppression du menu',
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-cuizly-primary mb-2">
              {t('menus.manageMenus')}
            </h1>
            <p className="text-muted-foreground">
              {t('menus.addUpToFive')}
            </p>
          </div>
        </div>

        {/* Add New Menu Button */}
        <div className="mb-6">
          <Button className="bg-cuizly-primary hover:bg-cuizly-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un menu
          </Button>
        </div>

        {/* Menus Grid */}
        {menus.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Aucun menu ajouté pour le moment
              </p>
              <Button className="bg-cuizly-primary hover:bg-cuizly-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre premier menu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <Card key={menu.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={menu.image_url}
                    alt="Menu"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={menu.is_active ? "default" : "secondary"}>
                      {menu.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-sm line-clamp-2">
                    {menu.description}
                  </CardTitle>
                  {menu.cuisine_type && (
                    <CardDescription>
                      Type: {menu.cuisine_type}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    {menu.dietary_restrictions?.map((restriction, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMenu(menu.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}