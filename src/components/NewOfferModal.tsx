import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";

interface NewOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string | null;
  onSuccess: () => void;
}

export const NewOfferModal = ({ 
  open, 
  onOpenChange, 
  restaurantId,
  onSuccess 
}: NewOfferModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: "",
    discount_amount: "",
    valid_until: "",
    category: "general",
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!restaurantId || !formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le titre de l'offre",
        variant: "destructive"
      });
      return;
    }

    if (!formData.discount_percentage && !formData.discount_amount) {
      toast({
        title: "Erreur", 
        description: "Veuillez spécifier un pourcentage ou un montant de réduction",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const offerData = {
        restaurant_id: restaurantId,
        title: formData.title,
        description: formData.description || null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        category: formData.category,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('offers')
        .insert(offerData);

      if (error) throw error;

      toast({
        title: "Offre créée",
        description: "Votre nouvelle offre a été publiée avec succès"
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        discount_percentage: "",
        discount_amount: "",
        valid_until: "",
        category: "general",
        is_active: true
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'offre",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle offre</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de l'offre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Pizza 2 pour 1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre offre en détail..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_percentage">Réduction (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_percentage: e.target.value,
                  discount_amount: "" // Reset other field
                }))}
                placeholder="20"
              />
            </div>
            <div>
              <Label htmlFor="discount_amount">Réduction ($)</Label>
              <Input
                id="discount_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_amount: e.target.value,
                  discount_percentage: "" // Reset other field
                }))}
                placeholder="5.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <select 
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="general">Générale</option>
              <option value="lunch">Déjeuner</option>
              <option value="dinner">Dîner</option>
              <option value="weekend">Week-end</option>
              <option value="happy_hour">Happy Hour</option>
            </select>
          </div>

          <div>
            <Label htmlFor="valid_until">Valide jusqu'au</Label>
            <Input
              id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              min={getMinDate()}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Activer l'offre immédiatement</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.title}
              className="flex-1"
            >
              {loading ? "Création..." : "Créer l'offre"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};