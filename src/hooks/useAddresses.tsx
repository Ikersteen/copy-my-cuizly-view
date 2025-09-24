import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { Address, AddressInput, AddressType } from '@/types/address';


export const useAddresses = (addressType?: AddressType) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryAddress, setPrimaryAddress] = useState<Address | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadAddresses();
    
    // Real-time subscription for address changes
    const channel = supabase
      .channel('addresses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'addresses'
        },
        () => {
          loadAddresses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addressType]);

  const loadAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (addressType) {
        query = query.eq('address_type', addressType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedAddresses = (data || []).map(addr => ({
        ...addr,
        address_type: addr.address_type as AddressType
      }));

      setAddresses(typedAddresses);

      // Set primary address
      const primary = typedAddresses.find(addr => 
        addr.is_primary && (!addressType || addr.address_type === addressType)
      );
      setPrimaryAddress(primary || null);

    } catch (error) {
      console.error('Error loading addresses:', error);
      toast({
        title: t('common.error'),
        description: t('addresses.cannotLoad'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressInput: AddressInput): Promise<Address | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Utilisateur non authentifié');
      }

      // If this is set as primary, remove primary flag from other addresses of same type
      if (addressInput.is_primary) {
        await supabase
          .from('addresses')
          .update({ is_primary: false })
          .eq('user_id', session.user.id)
          .eq('address_type', addressInput.address_type);
      }

      const newAddress = {
        ...addressInput,
        user_id: session.user.id,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('addresses')
        .insert(newAddress)
        .select()
        .single();

      if (error) throw error;

      await loadAddresses();

      toast({
        title: t('common.success'),
        description: t('addresses.createdSuccessfully')
      });

      return { ...data, address_type: data.address_type as AddressType };
    } catch (error) {
      console.error('Error creating address:', error);
      toast({
        title: t('common.error'),
        description: t('addresses.cannotCreate'),
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateAddress = async (id: string, updates: Partial<AddressInput>): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Utilisateur non authentifié');
      }

      // If setting as primary, remove primary flag from other addresses of same type
      if (updates.is_primary) {
        const address = addresses.find(addr => addr.id === id);
        if (address) {
          await supabase
            .from('addresses')
            .update({ is_primary: false })
            .eq('user_id', session.user.id)
            .eq('address_type', address.address_type)
            .neq('id', id);
        }
      }

      const { error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      await loadAddresses();

      toast({
        title: t('common.success'),
        description: t('addresses.updatedSuccessfully')
      });

      return true;
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: t('common.error'),
        description: t('addresses.cannotUpdate'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteAddress = async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('addresses')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      await loadAddresses();

      toast({
        title: t('common.success'),
        description: t('addresses.deletedSuccessfully')
      });

      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: t('common.error'),
        description: t('addresses.cannotDelete'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const setPrimary = async (id: string): Promise<boolean> => {
    return await updateAddress(id, { is_primary: true });
  };

  const getAddressesByType = (type: AddressType): Address[] => {
    return addresses.filter(addr => addr.address_type === type);
  };

  const getPrimaryAddressByType = (type: AddressType): Address | null => {
    return addresses.find(addr => 
      addr.address_type === type && addr.is_primary
    ) || null;
  };

  return {
    addresses,
    primaryAddress,
    loading,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimary,
    loadAddresses,
    getAddressesByType,
    getPrimaryAddressByType
  };
};